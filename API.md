# Yeti-Threads REST API

JWT tokens must be used for all calls with a user_id.

## /forums

###POST /forums

###GET /forums?offset=0&limit=20

###GET /forums/[id]

###PUT /forums/[id]

###DELETE /forums/[id]

## /threads

###POST /threads

###GET /threads?offset=0&limit=20

###GET /threads/[id]

###PUT /threads/[id]

###DELETE /threads/[id]

###GET /forums/[id]/threads?offset=0&limit=20

## /posts

###POST /posts

###GET /posts?offset=0&limit=20

###GET /posts/[id]

###PUT /posts/[id]

###DELETE /posts[id]

###GET /threads[id]/posts?offset=0&limit=20

## /access

POST/PUT requires the `forums_admin` scope.

###POST /access/[user_id]/forum/[forum_id]

###GET /access/[user_id]/forum/[forum_id]

###PUT /access/[user_id]/forum/[forum_id]

## /changes

###GET /changes?since=[timestamp]

# Yeti-Threads Websocket API
