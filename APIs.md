### Admin APIs

Admin user is created by default by the server. And the credentials for admin are available in env.json

- **Add new user**

url: http://localhost:8000/signup 

  method: `POST`

  bodytype: `json`

  body format: `{ "name": "username", "password": "password", "email": "useremail" }`

- **Edit user**

url: http://localhost:8000/users/edit/:userId 

  method: `PATCH`

  bodytype: `json`

  body format: `{ "name": "username", "password": "password", "email": "useremail" }`


### APIs for all users

- **Login**

url: http://localhost:8000/login 

  method: `POST`

  bodytype: `json`

  body format: `{ "name": "username", "password": "password" }`

  Note: Auth Token is set in authorization header of response

- **Get all users list**

url: http://localhost:8000/users/usersList 

  method: `GET`

  responseType: `array`

 - **Get single user**

url: http://localhost:8000/users/usersList?id={userId} 

  method: `GET`

- **Create new group**

url: http://localhost:8000/groups/create 

  method: `POST`

  bodytype: `json`

  body format: `{ "title": "group name" }`
  
  - **GET all groups list**

url: http://localhost:8000/groups/all 

  method: `GET`

  
  - **Delete group**

url: http://localhost:8000/groups/delete/:groupId

  method: `DELETE`

- **Add users to a group**

url: http://localhost:8000/groups/addUser 

  method: `POST`

  bodytype: `json`

  body format: `{ "groupId": "group id", "userId": "userId" }`


- **Search a group**

url: http://localhost:8000/groups/search 

  method: `GET`

  query parameter: `title: "part of the group title"`

  
### APIs for chat ###

Browser has to connect to the server through a websocket

url: `ws://localhost:8000/`

socket Events: 

-- message: to send message to server (groups)

-- reply: to listen to the messages form server (groups)

- Client should emit **message** event to send a message to a group

body type: `JSON`

body format: `{"text": "message content", "groupId": "id of group" }` 

- Client should listen to **reply** event to recieve the messages from groups 


### like messages ###

url: http://localhost:8000/messages/like/:messageId 

  method: `PATCH`

 












