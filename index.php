<?php
  echo getcwd() . "<br>";
  chdir('./Cordova_v4/ParentPlanet/platforms/browser/www');
  echo getcwd() . "<br>";
  include_once("index.html");
?>
