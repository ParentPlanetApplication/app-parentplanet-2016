# Requirement
- [Heroku toolbelt](https://devcenter.heroku.com/articles/heroku-command-line)
- Terminate/CommandLine
- [Git tool](https://git-scm.com/)

# HowToUse
- clone code from deploy branch
- at local, edit file ```deploy.sh```, ```deploy.bat```

  ```BROWSE_PLATFORM_DIR``` - your path will point to your project PP (platform ```Browser```)
- after build platform: ```cordova build browser```
- run ```./deploy.sh``` (mac os), ```deploy.bat``` (win)
- heroku will auto open web app

Enjoy :)
