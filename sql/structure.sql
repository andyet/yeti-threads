DROP DATABASE "yeti-threads";
CREATE DATABASE "yeti-threads" ENCODING 'UTF8';
\connect "yeti-threads";

CREATE EXTENSION ltree;
CREATE EXTENSION "uuid-ossp";
CREATE EXTENSION citext;

--FORUMS
CREATE TABLE forums (
    id SERIAL PRIMARY KEY,
    owner TEXT,
    name CITEXT,
    description TEXT,
    parent_id INTEGER REFERENCES forums(id) ON DELETE SET NULL,
    path LTREE,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_forums_path on forums USING GIST (path);
CREATE INDEX idx_forums_owner on forums(owner);
CREATE INDEX idx_forums_name on forums(name);

CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    forum_id INTEGER REFERENCES forums(id) ON DELETE CASCADE,
    author TEXT,
    subject TEXT,
    open BOOLEAN NOT NULL DEFAULT True,
    locked BOOLEAN NOT NULL DEFAULT False,
    tags TEXT[],
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_threads_tags on threads USING GIN (tags);
create index idx_threads_author on threads(author);
create index idx_threads_open on threads(open);
CREATE INDEX idx_threads_forum_id on threads(forum_id);

CREATE TABLE threads_references (
    from_thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
    to_thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
    UNIQUE(from_thread_id, to_thread_id)
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    author TEXT,
    body TEXT,
    parent_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
    thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
    path LTREE,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_author on threads(author);

CREATE TABLE forums_access (
    user_id TEXT,
    forum_id INTEGER,
    read BOOLEAN DEFAULT FALSE,
    write BOOLEAN DEFAULT FALSE,
    post BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, forum_id)
);

CREATE TABLE posts_read (
    user_id TEXT,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    read BOOLEAN NOT NULL DEFAULT False,
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE forums_log (
    forum_id INTEGER,
    tbl TEXT,
    other_id INTEGER,
    op TEXT,
    time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_forums_log_time ON forums_log(time);
