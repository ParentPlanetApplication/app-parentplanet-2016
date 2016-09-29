###### Contant

### Change path platform browser on your project

SRC=BROWSE_PLATFORM_DIR
DEST=.

###### Function

function updateSrcFromProject2StagingWebApp() {
  echo '+ Copying file from ....'
  cp -r ${SRC} ${DEST}
}

function makeSureConfigIsStagingServer() {
  #statements
  echo '+ Make sure config alway point to Staging Server'
  sed -i -e 's/-AwsProduction//;s/13370/1337/;s/Production/Staging/' "${DEST}/config.js"
}

function renameIndex2Home() {
  #statements
  mv "${DEST}/index.html" "${DEST}/home.html"
}

function push2Github() {
  #statements
  echo '+ Push code to master'
  git add .
  git commit -m "update platform browser from user ${USER}"
  git push --force
}

function deploy2Heroku() {
  #statements
  echo '+ Deploying to server'
  git push heroku deploy:master --force
  heroku open
}

function completed() {
  #statements
  echo '+ Done'
}

##### MAIN

updateSrcFromProject2StagingWebApp
makeSureConfigIsStagingServer
renameIndex2Home
push2Github
deploy2Heroku
completed
