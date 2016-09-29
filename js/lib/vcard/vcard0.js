var vcard = function() {
    'use strict';
    if (navigator.userAgent.indexOf('MSIE') > -1 && navigator.userAgent.indexOf('MSIE 10') == -1) {
        console.log('Unsupported Browser');
        return;
    }
    var SEPARATOR = (navigator.appVersion.indexOf('Win') !== -1) ? '\r\n' : '\n';
    var SEMI = ';';
    var EQUALS = '=';
    var COLONSEMI = ':;';
    var PERIOD = '.';
    var BLANK = '';
    var COLON = ':';
    var COMMA = ',';
    var DASH = '-';
    var generate_adr, generate_bday, generate_categories, generate_class, generate_email, generate_fn, generate_geo, generate_key, generate_label, generate_logo, generate_mailer, generate_n, generate_nickname, generate_note, generate_org, generate_photo, generate_prodid, generate_rev, generate_role, generate_sort_string, generate_sound, generate_tel, generate_title, generate_tz, generate_uid, generate_url, m, parse_adr, parse_bday, parse_categories, parse_class, parse_email, parse_fn, parse_geo, parse_key, parse_label, parse_line, parse_logo, parse_mailer, parse_n, parse_nickname, parse_note, parse_org, parse_params, parse_photo, parse_prodid, parse_rev, parse_role, parse_sort_string, parse_sound, parse_tel, parse_title, parse_tz, parse_uid, parse_url;
    var _vcard = '';
    generate_fn = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'FN';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|language|x-\w+/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.name + SEPARATOR;
        return string;
    };
    generate_n = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'N';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|language|x-\w+/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += json.families ? COLON + (json.families.join(COMMA)) + SEMI : COLONSEMI;
        string += json.givens ? BLANK + (json.givens.join(COMMA)) + SEMI : SEMI;
        string += json.middles ? BLANK + (json.middles.join(COMMA)) + SEMI : SEMI;
        string += json.prefixes ? BLANK + (json.prefixes.join(COMMA)) + SEMI : SEMI;
        string += json.suffixes ? BLANK + (json.suffixes.join(COMMA)) + SEPARATOR : SEPARATOR;
        return string;
    };
    generate_nickname = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'NICKNAME';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|language|x-\w+/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + (json.names.join(COMMA)) + SEPARATOR;
        return string;
    };
    generate_photo = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'PHOTO';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|encoding|type/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.image + SEPARATOR;
        return string;
    };
    generate_bday = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'BDAY';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.year + DASH + json.month + DASH + json.day;
        if (json.params && json.params.value && (json.params.value === 'date-time')) {
            string += 'T' + json.hour + COLON + json.minute + COLON + json.second + 'Z';
        }
        string += SEPARATOR;
        return string;
    };
    generate_adr = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'ADR';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|language|x-\w+/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
                if (k.match(/types/)) {
                    string += ';TYPE=' + (v.join(COMMA).toUpperCase());
                }
            }
        }
        if (json.pobox) {
            string += COLON + json.pobox + SEMI;
        } else {
            string += COLONSEMI;
        }
        if (json.extended) {
            string += BLANK + json.extended + SEMI;
        } else {
            string += SEMI;
        }
        if (json.street) {
            string += BLANK + json.street + SEMI;
        } else {
            string += SEMI;
        }
        if (json.locality) {
            string += BLANK + json.locality + SEMI;
        } else {
            string += SEMI;
        }
        if (json.region) {
            string += BLANK + json.region + SEMI;
        } else {
            string += SEMI;
        }
        if (json.code) {
            string += BLANK + json.code + SEMI;
        } else {
            string += SEMI;
        }
        if (json.country) {
            string += BLANK + json.country + SEPARATOR;
        } else {
            string += SEPARATOR;
        }
        return string;
    };
    generate_label = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'LABEL';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|language|x-\w+/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
                if (k.match(/types/)) {
                    string += ';TYPE=' + (v.join(COMMA).toUpperCase());
                }
            }
        }
        string += COLON + json.address + SEPARATOR;
        return string;
    };
    generate_tel = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'TEL';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/types/)) {
                    string += ';TYPE=' + (v.join(COMMA).toUpperCase());
                }
            }
        }
        string += COLON + json.number + SEPARATOR;
        return string;
    };
    generate_email = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'EMAIL';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/types/)) {
                    string += ';TYPE=' + (v.join(COMMA).toUpperCase());
                }
            }
        }
        string += COLON + json.address + SEPARATOR;
        return string;
    };
    generate_mailer = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'MAILER';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|language|x-\w+/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.name + SEPARATOR;
        return string;
    };
    generate_tz = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'TZ';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.zone;
        string += SEPARATOR;
        return string;
    };
    generate_geo = function(json) {
        var string;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'GEO';
        string += COLON + json.latitude + SEMI + json.longitude + SEPARATOR;
        return string;
    };
    generate_title = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'TITLE';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|language|x-\w+/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.name + SEPARATOR;
        return string;
    };
    generate_role = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'ROLE';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|language|x-\w+/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.name + SEPARATOR;
        return string;
    };
    generate_logo = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'LOGO';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|encoding|type/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.image + SEPARATOR;
        return string;
    };
    generate_org = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'ORG';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|language|x-\w+/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.name;
        string += SEMI + json.unit;
        string += SEMI + json.unit2;
        string += SEPARATOR;
        return string;
    };
    generate_categories = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'CATEGORIES';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|language|x-\w+/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + (json.names.join(COMMA)) + SEPARATOR;
        return string;
    };
    generate_note = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'NOTE';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|language|x-\w+/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.description + SEPARATOR;
        return string;
    };
    generate_prodid = function(json) {
        var string;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'PRODID';
        string += COLON + json.id + SEPARATOR;
        return string;
    };
    generate_rev = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'REV';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.year + DASH + json.month + DASH + json.day;
        if (json.hour && json.minute && json.second) {
            string += 'T' + json.hour + COLON + json.minute + COLON + json.second + 'Z';
        }
        string += SEPARATOR;
        return string;
    };
    generate_sort_string = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'SORT-STRING';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|language|x-\w+/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.name + SEPARATOR;
        return string;
    };
    generate_sound = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'SOUND';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|encoding|type/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.value + SEPARATOR;
        return string;
    };
    generate_uid = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'UID';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/type/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.id + SEPARATOR;
        return string;
    };
    generate_url = function(json) {
        var string;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'URL';
        string += COLON + json.uri + SEPARATOR;
        return string;
    };
    generate_class = function(json) {
        var string;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'CLASS';
        string += COLON + (json.name.toUpperCase()) + SEPARATOR;
        return string;
    };
    generate_key = function(json) {
        var k, string, v, _ref;
        string = BLANK;
        if (json.group) {
            string += BLANK + json.group + PERIOD;
        }
        string += 'KEY';
        if (json.params) {
            _ref = json.params;
            for (k in _ref) {
                v = _ref[k];
                if (k.match(/value|encoding|type/i)) {
                    string += SEMI + (k.toUpperCase()) + EQUALS + (v.toUpperCase());
                }
            }
        }
        string += COLON + json.value + SEPARATOR;
        return string;
    };
    var generate = function(json) {
        var adr, email, k, klass, label, logo, note, org, photo, role, sound, string, tel, title, url, v, _i, _j, _k, _l, _len, _len1, _len10, _len11, _len12, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _len9, _m, _n, _o, _p, _q, _r, _ref, _ref1, _ref10, _ref11, _ref12, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _s, _t, _u;
        string = BLANK;
        string += 'BEGIN:VCARD' + SEPARATOR;
        for (k in json) {
            v = json[k];
            switch (k) {
                case 'version':
                    string += 'VERSION:' + v + SEPARATOR;
                    break;
                case 'fn':
                    string += generate_fn(json.fn);
                    break;
                case 'n':
                    string += generate_n(json.n);
                    break;
                case 'nickname':
                    string += generate_nickname(json.nickname);
                    break;
                case 'photos':
                    _ref = json.photos;
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        photo = _ref[_i];
                        string += generate_photo(photo);
                    }
                    break;
                case 'bday':
                    string += generate_bday(json.bday);
                    break;
                case 'adrs':
                    _ref1 = json.adrs;
                    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                        adr = _ref1[_j];
                        string += generate_adr(adr);
                    }
                    break;
                case 'labels':
                    _ref2 = json.labels;
                    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                        label = _ref2[_k];
                        string += generate_label(label);
                    }
                    break;
                case 'tels':
                    _ref3 = json.tels;
                    for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
                        tel = _ref3[_l];
                        string += generate_tel(tel);
                    }
                    break;
                case 'emails':
                    _ref4 = json.emails;
                    for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
                        email = _ref4[_m];
                        string += generate_email(email);
                    }
                    break;
                case 'mailer':
                    string += generate_mailer(json.mailer);
                    break;
                case 'tz':
                    string += generate_tz(json.tz);
                    break;
                case 'geo':
                    string += generate_geo(json.geo);
                    break;
                case 'titles':
                    _ref5 = json.titles;
                    for (_n = 0, _len5 = _ref5.length; _n < _len5; _n++) {
                        title = _ref5[_n];
                        string += generate_title(title);
                    }
                    break;
                case 'roles':
                    _ref6 = json.roles;
                    for (_o = 0, _len6 = _ref6.length; _o < _len6; _o++) {
                        role = _ref6[_o];
                        string += generate_role(role);
                    }
                    break;
                case 'logos':
                    _ref7 = json.logos;
                    for (_p = 0, _len7 = _ref7.length; _p < _len7; _p++) {
                        logo = _ref7[_p];
                        string += generate_logo(logo);
                    }
                    break;
                case 'orgs':
                    _ref8 = json.orgs;
                    for (_q = 0, _len8 = _ref8.length; _q < _len8; _q++) {
                        org = _ref8[_q];
                        string += generate_org(org);
                    }
                    break;
                case 'categories':
                    string += generate_categories(json.categories);
                    break;
                case 'notes':
                    _ref9 = json.notes;
                    for (_r = 0, _len9 = _ref9.length; _r < _len9; _r++) {
                        note = _ref9[_r];
                        string += generate_note(note);
                    }
                    break;
                case 'prodid':
                    string += generate_prodid(json.prodid);
                    break;
                case 'rev':
                    string += generate_rev(json.rev);
                    break;
                case 'sort_string':
                    string += generate_sort_string(json.sort_string);
                    break;
                case 'sounds':
                    _ref10 = json.sounds;
                    for (_s = 0, _len10 = _ref10.length; _s < _len10; _s++) {
                        sound = _ref10[_s];
                        string += generate_sound(sound);
                    }
                    break;
                case 'uid':
                    string += generate_uid(json.uid);
                    break;
                case 'urls':
                    _ref11 = json.urls;
                    for (_t = 0, _len11 = _ref11.length; _t < _len11; _t++) {
                        url = _ref11[_t];
                        string += generate_url(url);
                    }
                    break;
                case 'classes':
                    _ref12 = json.classes;
                    for (_u = 0, _len12 = _ref12.length; _u < _len12; _u++) {
                        klass = _ref12[_u];
                        string += generate_class(klass);
                    }
                    break;
                case 'key':
                    string += generate_key(json.key);
            }
        }
        return string += 'END:VCARD';
    };

    return {

        /**
         * Download calendar using the saveAs function from filesave.js
         * @param  {string} filename Filename
         * @param  {string} ext      Extention
         */
        'addVcard': function(o) {
            //fn = {"version" : "3.0", "fn": {"group" : "item1", "params" : {"value" : "text", "language" : "en", "x-param" : "value"}, "name" : "Andrew Pace"}};
            //n = {"version" : "3.0", "n": {"group" : "item1", "params" : {"value" : "text", "language" : "en", "x-param" : "value"}, "givens" : ["Andrew"], "middles" : ["Patrick"], "families" : ["Pace"], "prefixes" : ["Mr", "Dr"], "suffixes" : ["MD"]}};
            //tel = {"version" : "3.0", "tels": [{"group" : "item1", "params" : {"types" : ["home", "work"]}, "number" : "+1-323-243-7314"}]};
            //email = {"version" : "3.0", "emails": [{"group" : "item1", "params" : {"types" : ["home", "work"]}, "address" : "andrewppace@gmail.com"}]};
            var name = o.name.split(' ');
            var givens = [];
            givens.push((name.length > 0 ? name[0] : ''));
            var families = [];
            families.push((name.length > 1 ? name[1] : ''));
            var mt = [''];
            var emails = [];
            var tels = [];
            var i = 0;
            for (i = 0; i < o.emails.length; i++) {
                emails.push({
                    "params": {
                        "types": [o.emails[i].type]
                    },
                    "address": o.emails[i].value
                });
            }
            for (i = 0; i < o.phoneNumbers.length; i++) {
                tels.push({
                    "params": {
                        "types": [o.phoneNumbers[i].type]
                    },
                    "number": o.phoneNumbers[i].value
                });
            }
            var json = {
                'version': '3.0',
                'n': {
                    "params": {
                        "value": "text",
                        "language": "en",
                        "x-param": "value"
                    },
                    "givens": givens,
                    "middles": mt,
                    "families": families,
                    "prefixes": mt,
                    "suffixes": mt
                },
                'fn': {
                    "params": {
                        "value": "text",
                        "language": "en",
                        "x-param": "value"
                    },
                    "name": o.name
                },
                'emails': emails,
                'tels': tels
            };
            _vcard = generate(json);
        },
        'download': function(filename, ext) {
            ext = (typeof ext !== 'undefined') ? ext : '.vcf';
            filename = (typeof filename !== 'undefined') ? filename : 'vcard';
            var __vcard = _vcard;
            var blob;
            if (navigator.userAgent.indexOf('MSIE 10') === -1) { // chrome or firefox
                blob = new Blob([_vcard]);
            } else { // ie
                var bb = new BlobBuilder();
                bb.append(_vcard);
                blob = bb.getBlob('text/vcard;charset=' + document.characterSet);
            }
            saveAs(blob, filename + ext);
            return _vcard;
        }

    }; //eo return
}; //eo vcard
