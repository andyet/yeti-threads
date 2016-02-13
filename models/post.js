"use strict";

const SQL = require('sql-template-strings');
const joi = require('joi');

module.exports = (gatepost) => {

  const Post = new gatepost.Model({
    id: {
      validate: joi.number().integer(),
      primary: true
    },
    author: {
      validate: joi.string().max(50)
    },
    body: {
      validate: joi.string()
    },
    parent_id: {
      validate: joi.number().integer()
    },
    thread_id: {
      validate: joi.number().integer()
    },
    path: {
      processIn: function (value) {
        if (!value) {
          return [];
        }
        return value.split('.');
      },
      processOut: function (value) {
        if (!value) {
          return '';
        }
        return value.join('.');
      },
      //validate: joi.string().max(255)
    },
    created: {
      validate: joi.date()
    },
    updated: {
      validate: joi.date()
    }
  }, {
    name: 'post',
    cach: true
  });

  const PostPage = new gatepost.Model({
    count: {type: 'integer'},
    total: {type: 'integer'},
    results: {collection: Post}
  });

  Post.registerFactorySQL({
    name: "get",
    sql: (args) => SQL`SELECT posts.id, posts.author, posts.body, posts.parent_id, posts.thread_id, posts.path, posts.created, posts.updated FROM posts
  JOIN threads ON posts.thread_id=threads.id
  JOIN forums ON threads.forum_id=forums.id
  JOIN forums_access ON forums_access.forum_id=forums.id
  WHERE posts.id=${args.post_id} AND ((forums_access.user_id=${args.user_id} AND forums_access.read=True) OR forums.owner=${args.user_id})`,
    oneResult: true
  });

  Post.registerFactorySQL({
    name: "deconste",
    sql: (args) => SQL`DELETE FROM posts WHERE id=${args.id}`,
    oneResult: true
  });

  Post.fromSQL({
    name: 'insert',
    instance: true,
    sql: (args, model) => SQL`SELECT * FROM create_post(${model.toJSON()}, ${args.user})`,
    oneResult: true,
    require: true
  });

  Post.fromSQL({
    name: 'update',
    instance: true,
    sql: (args, model) => SQL`SELECT update_post(${model.toJSON()}, ${args.user}) AS id`,
    oneResult: true,
    require: true
  });


  PostPage.fromSQL({
    name: "all",
    sql: (args) => SQL`SELECT (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname='posts') AS total,
      json_agg(row_to_json(post_rows)) as results,
      count(post_rows.*)::INTEGER as count
      FROM (SELECT id, author, body, parent_id, thread_id, path, created, updated
      FROM posts
      JOIN threads ON posts.thread_id=threads.id
      JOIN forums ON threads.forum_id=forums.id
      JOIN forums_access ON forums_access.forum_id=forums.id
      WHERE (forums_access.user_id=${args.user_id} AND forums_access.read=True) OR forums.owner=${args.user_id}
      ORDER BY posts.id LIMIT ${args.limit} OFFSET ${args.offset}) post_rows`,
    defaults: {
      limit: 20,
      offset: 0
    },
    oneResult: true
  });

  PostPage.registerFactorySQL({
    name: 'allByThread',
    sql: (args) => SQL`SELECT (SELECT count(id)::INTEGER FROM posts WHERE thread_id=${args.thread_id}) AS total,
  json_agg(row_to_json(post_rows)) as results,
  count(post_rows.*)::INTEGER as count
  FROM (WITH RECURSIVE included_posts(id, author, body, parent_id, thread_id, path, created, updated) AS (
    SELECT id, author, body, parent_id, thread_id, path, created, updated FROM posts WHERE parent_id IS NULL AND thread_id=${args.thread_id}
  UNION ALL
    SELECT p.id, p.author, p.body, p.parent_id, p.thread_id, p.path, p.created, p.updated FROM included_posts inc_p, posts p WHERE p.parent_id=inc_p.id
  )
  SELECT * FROM included_posts
  JOIN threads ON included_posts.thread_id=threads.id
  JOIN forums ON threads.forum_id=forums.id
  JOIN forums_access ON forums_access.forum_id=forums.id
  WHERE (forums_access.user_id=${args.user_id} AND forums_access.read=True) OR forums.owner=${args.user_id}
  ORDER BY included_posts.path LIMIT ${args.limit} OFFSET ${args.offset}) post_rows`,
    defaults: {
      limit: 20,
      offset: 0
    },
    oneResult: true
  });

  Post.all = PostPage.all;
  Post.allByThread = PostPage.allByThread;

  return Post;
};

