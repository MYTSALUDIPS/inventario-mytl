[render.yaml](https://github.com/user-attachments/files/23564597/render.yaml)
services:
  - type: web
    name: inventario-myt
    env: node
    buildCommand: "npm install"
    startCommand: "npm start"
    autoDeploy: true
