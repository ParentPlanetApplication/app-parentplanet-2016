//original getTimeZone from SO; rewrite to use _. instead of if/else if :}
function getTimezoneName() {
    var timeSummer = new Date(Date.UTC(2005, 6, 30, 0, 0, 0, 0));
    var summerOffset = -1 * timeSummer.getTimezoneOffset();
    var timeWinter = new Date(Date.UTC(2005, 12, 30, 0, 0, 0, 0));
    var winterOffset = -1 * timeWinter.getTimezoneOffset();
    var timeZoneHiddenField;

    if (-720 == summerOffset && -720 == winterOffset) { timeZoneHiddenField = 'Dateline Standard Time'; }
    else if (-660 == summerOffset && -660 == winterOffset) { timeZoneHiddenField = 'UTC-11'; }
    else if (-660 == summerOffset && -660 == winterOffset) { timeZoneHiddenField = 'Samoa Standard Time'; }
    else if (-660 == summerOffset && -600 == winterOffset) { timeZoneHiddenField = 'Hawaiian Standard Time'; }
    else if (-570 == summerOffset && -570 == winterOffset) { timeZoneHiddenField = 'Pacific/Marquesas'; }
    else if (-480 == summerOffset && -540 == winterOffset) { timeZoneHiddenField = 'Alaskan Standard Time'; }
    else if (-420 == summerOffset && -480 == winterOffset) { timeZoneHiddenField = 'Pacific Standard Time'; }
    else if (-420 == summerOffset && -420 == winterOffset) { timeZoneHiddenField = 'US Mountain Standard Time'; }
    else if (-360 == summerOffset && -420 == winterOffset) { timeZoneHiddenField = 'Mountain Standard Time'; }
    else if (-360 == summerOffset && -360 == winterOffset) { timeZoneHiddenField = 'Central America Standard Time'; }
    else if (-300 == summerOffset && -360 == winterOffset) { timeZoneHiddenField = 'Central Standard Time'; }
    else if (-300 == summerOffset && -300 == winterOffset) { timeZoneHiddenField = 'SA Pacific Standard Time'; }
    else if (-240 == summerOffset && -300 == winterOffset) { timeZoneHiddenField = 'Eastern Standard Time'; }
    else if (-270 == summerOffset && -270 == winterOffset) { timeZoneHiddenField = 'Venezuela Standard Time'; }
    else if (-240 == summerOffset && -240 == winterOffset) { timeZoneHiddenField = 'SA Western Standard Time'; }
    else if (-240 == summerOffset && -180 == winterOffset) { timeZoneHiddenField = 'Central Brazilian Standard Time'; }
    else if (-180 == summerOffset && -240 == winterOffset) { timeZoneHiddenField = 'Atlantic Standard Time'; }
    else if (-180 == summerOffset && -180 == winterOffset) { timeZoneHiddenField = 'Montevideo Standard Time'; }
    else if (-180 == summerOffset && -120 == winterOffset) { timeZoneHiddenField = 'E. South America Standard Time'; }
    else if (-150 == summerOffset && -210 == winterOffset) { timeZoneHiddenField = 'Mid-Atlantic Standard Time'; }
    else if (-120 == summerOffset && -180 == winterOffset) { timeZoneHiddenField = 'America/Godthab'; }
    else if (-120 == summerOffset && -120 == winterOffset) { timeZoneHiddenField = 'SA Eastern Standard Time'; }
    else if (-60 == summerOffset && -60 == winterOffset) { timeZoneHiddenField = 'Cape Verde Standard Time'; }
    else if (0 == summerOffset && -60 == winterOffset) { timeZoneHiddenField = 'Azores Daylight Time'; }
    else if (0 == summerOffset && 0 == winterOffset) { timeZoneHiddenField = 'Morocco Standard Time'; }
    else if (60 == summerOffset && 0 == winterOffset) { timeZoneHiddenField = 'GMT Standard Time'; }
    else if (60 == summerOffset && 60 == winterOffset) { timeZoneHiddenField = 'Africa/Algiers'; }
    else if (60 == summerOffset && 120 == winterOffset) { timeZoneHiddenField = 'Namibia Standard Time'; }
    else if (120 == summerOffset && 60 == winterOffset) { timeZoneHiddenField = 'Central European Standard Time'; }
    else if (120 == summerOffset && 120 == winterOffset) { timeZoneHiddenField = 'South Africa Standard Time'; }
    else if (180 == summerOffset && 120 == winterOffset) { timeZoneHiddenField = 'GTB Standard Time'; }
    else if (180 == summerOffset && 180 == winterOffset) { timeZoneHiddenField = 'E. Africa Standard Time'; }
    else if (240 == summerOffset && 180 == winterOffset) { timeZoneHiddenField = 'Russian Standard Time'; }
    else if (240 == summerOffset && 240 == winterOffset) { timeZoneHiddenField = 'Arabian Standard Time'; }
    else if (270 == summerOffset && 210 == winterOffset) { timeZoneHiddenField = 'Iran Standard Time'; }
    else if (270 == summerOffset && 270 == winterOffset) { timeZoneHiddenField = 'Afghanistan Standard Time'; }
    else if (300 == summerOffset && 240 == winterOffset) { timeZoneHiddenField = 'Pakistan Standard Time'; }
    else if (300 == summerOffset && 300 == winterOffset) { timeZoneHiddenField = 'West Asia Standard Time'; }
    else if (330 == summerOffset && 330 == winterOffset) { timeZoneHiddenField = 'India Standard Time'; }
    else if (345 == summerOffset && 345 == winterOffset) { timeZoneHiddenField = 'Nepal Standard Time'; }
    else if (360 == summerOffset && 300 == winterOffset) { timeZoneHiddenField = 'N. Central Asia Standard Time'; }
    else if (360 == summerOffset && 360 == winterOffset) { timeZoneHiddenField = 'Central Asia Standard Time'; }
    else if (390 == summerOffset && 390 == winterOffset) { timeZoneHiddenField = 'Myanmar Standard Time'; }
    else if (420 == summerOffset && 360 == winterOffset) { timeZoneHiddenField = 'North Asia Standard Time'; }
    else if (420 == summerOffset && 420 == winterOffset) { timeZoneHiddenField = 'SE Asia Standard Time'; }
    else if (480 == summerOffset && 420 == winterOffset) { timeZoneHiddenField = 'North Asia East Standard Time'; }
    else if (480 == summerOffset && 480 == winterOffset) { timeZoneHiddenField = 'China Standard Time'; }
    else if (540 == summerOffset && 480 == winterOffset) { timeZoneHiddenField = 'Yakutsk Standard Time'; }
    else if (540 == summerOffset && 540 == winterOffset) { timeZoneHiddenField = 'Tokyo Standard Time'; }
    else if (570 == summerOffset && 570 == winterOffset) { timeZoneHiddenField = 'Cen. Australia Standard Time'; }
    else if (570 == summerOffset && 630 == winterOffset) { timeZoneHiddenField = 'Australia/Adelaide'; }
    else if (600 == summerOffset && 540 == winterOffset) { timeZoneHiddenField = 'Asia/Yakutsk'; }
    else if (600 == summerOffset && 600 == winterOffset) { timeZoneHiddenField = 'E. Australia Standard Time'; }
    else if (600 == summerOffset && 660 == winterOffset) { timeZoneHiddenField = 'AUS Eastern Standard Time'; }
    else if (630 == summerOffset && 660 == winterOffset) { timeZoneHiddenField = 'Australia/Lord_Howe'; }
    else if (660 == summerOffset && 600 == winterOffset) { timeZoneHiddenField = 'Tasmania Standard Time'; }
    else if (660 == summerOffset && 660 == winterOffset) { timeZoneHiddenField = 'West Pacific Standard Time'; }
    else if (690 == summerOffset && 690 == winterOffset) { timeZoneHiddenField = 'Central Pacific Standard Time'; }
    else if (720 == summerOffset && 660 == winterOffset) { timeZoneHiddenField = 'Magadan Standard Time'; }
    else if (720 == summerOffset && 720 == winterOffset) { timeZoneHiddenField = 'Fiji Standard Time'; }
    else if (720 == summerOffset && 780 == winterOffset) { timeZoneHiddenField = 'New Zealand Standard Time'; }
    else if (765 == summerOffset && 825 == winterOffset) { timeZoneHiddenField = 'Pacific/Chatham'; }
    else if (780 == summerOffset && 780 == winterOffset) { timeZoneHiddenField = 'Tonga Standard Time'; }
    else if (840 == summerOffset && 840 == winterOffset) { timeZoneHiddenField = 'Pacific/Kiritimati'; }
    else { timeZoneHiddenField = 'US/Pacific'; }
    return timeZoneHiddenField;
}

//take original timezone function and clean up for underscore usage
function getTimeZone() {
    var timeSummer = new Date(Date.UTC(2005, 6, 30, 0, 0, 0, 0));
    var summerOffset = -1 * timeSummer.getTimezoneOffset();
    var timeWinter = new Date(Date.UTC(2005, 12, 30, 0, 0, 0, 0));
    var winterOffset = -1 * timeWinter.getTimezoneOffset();
    var timeZone;
    var _zones = [ //extract parameters
  { summer: -720, winter: -720, zone: 'Dateline Standard Time' },
  { summer: -660, winter: -660, zone: 'UTC-11' },
  { summer: -660, winter: -660, zone: 'Samoa Standard Time' },
  { summer: -660, winter: -600, zone: 'Hawaiian Standard Time' },
  { summer: -570, winter: -570, zone: 'Pacific/Marquesas' },
  { summer: -480, winter: -540, zone: 'Alaskan Standard Time' },
  { summer: -420, winter: -480, zone: 'Pacific Standard Time' },
  { summer: -420, winter: -420, zone: 'US Mountain Standard Time' },
  { summer: -360, winter: -420, zone: 'Mountain Standard Time' },
  { summer: -360, winter: -360, zone: 'Central America Standard Time' },
  { summer: -300, winter: -360, zone: 'Central Standard Time' },
  { summer: -300, winter: -300, zone: 'SA Pacific Standard Time' },
  { summer: -240, winter: -300, zone: 'Eastern Standard Time' },
  { summer: -270, winter: -270, zone: 'Venezuela Standard Time' },
  { summer: -240, winter: -240, zone: 'SA Western Standard Time' },
  { summer: -240, winter: -180, zone: 'Central Brazilian Standard Time' },
  { summer: -180, winter: -240, zone: 'Atlantic Standard Time' },
  { summer: -180, winter: -180, zone: 'Montevideo Standard Time' },
  { summer: -180, winter: -120, zone: 'E. South America Standard Time' },
  { summer: -150, winter: -210, zone: 'Mid-Atlantic Standard Time' },
  { summer: -120, winter: -180, zone: 'America/Godthab' },
  { summer: -120, winter: -120, zone: 'SA Eastern Standard Time' },
  { summer: -60,  winter: -60,  zone: 'Cape Verde Standard Time' },
  { summer: 0,    winter: -60,  zone: 'Azores Daylight Time' },
  { summer: 0,    winter: 0,    zone: 'Morocco Standard Time' },
  { summer: 60,   winter: 0,    zone: 'GMT Standard Time' },
  { summer: 60,   winter: 60,   zone: 'Africa/Algiers' },
  { summer: 60,   winter: 120,  zone: 'Namibia Standard Time' },
  { summer: 120,  winter: 60,   zone: 'Central European Standard Time' },
  { summer: 120,  winter: 120,  zone: 'South Africa Standard Time' },
  { summer: 180,  winter: 120,  zone: 'GTB Standard Time' },
  { summer: 180,  winter: 180,  zone: 'E. Africa Standard Time' },
  { summer: 240,  winter: 180,  zone: 'Russian Standard Time' },
  { summer: 240,  winter: 240,  zone: 'Arabian Standard Time' },
  { summer: 270,  winter: 210,  zone: 'Iran Standard Time' },
  { summer: 270,  winter: 270,  zone: 'Afghanistan Standard Time' },
  { summer: 300,  winter: 240,  zone: 'Pakistan Standard Time' },
  { summer: 300,  winter: 300,  zone: 'West Asia Standard Time' },
  { summer: 330,  winter: 330,  zone: 'India Standard Time' },
  { summer: 345,  winter: 345,  zone: 'Nepal Standard Time' },
  { summer: 360,  winter: 300,  zone: 'N. Central Asia Standard Time' },
  { summer: 360,  winter: 360,  zone: 'Central Asia Standard Time' },
  { summer: 390,  winter: 390,  zone: 'Myanmar Standard Time' },
  { summer: 420,  winter: 360,  zone: 'North Asia Standard Time' },
  { summer: 420,  winter: 420,  zone: 'SE Asia Standard Time' },
  { summer: 480,  winter: 420,  zone: 'North Asia East Standard Time' },
  { summer: 480,  winter: 480,  zone: 'China Standard Time' },
  { summer: 540,  winter: 480,  zone: 'Yakutsk Standard Time' },
  { summer: 540,  winter: 540,  zone: 'Tokyo Standard Time' },
  { summer: 570,  winter: 570,  zone: 'Cen. Australia Standard Time' },
  { summer: 570,  winter: 630,  zone: 'Australia/Adelaide' },
  { summer: 600,  winter: 540,  zone: 'Asia/Yakutsk' },
  { summer: 600,  winter: 600,  zone: 'E. Australia Standard Time' },
  { summer: 600,  winter: 660,  zone: 'AUS Eastern Standard Time' },
  { summer: 630,  winter: 660,  zone: 'Australia/Lord_Howe' },
  { summer: 660,  winter: 600,  zone: 'Tasmania Standard Time' },
  { summer: 660,  winter: 660,  zone: 'West Pacific Standard Time' },
  { summer: 690,  winter: 690,  zone: 'Central Pacific Standard Time' },
  { summer: 720,  winter: 660,  zone: 'Magadan Standard Time' },
  { summer: 720,  winter: 720,  zone: 'Fiji Standard Time' },
  { summer: 720,  winter: 780,  zone: 'New Zealand Standard Time' },
  { summer: 765,  winter: 825,  zone: 'Pacific/Chatham' },
  { summer: 780,  winter: 780,  zone: 'Tonga Standard Time' },
  { summer: 840,  winter: 840,  zone: 'Pacific/Kiritimati' } ]

  //test and return the first matching timezone
  timeZone = _.find(_zones, function(o){ 
    var flag = (o.summer === summerOffset && o.winter === winterOffset);
    return flag; 
  });

  return timeZone.zone;
};