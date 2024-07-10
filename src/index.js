"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
var passport_twitter_oauth2_1 = require("@superfaceai/passport-twitter-oauth2");
var express_1 = require("express");
var express_session_1 = require("express-session");
var passport_1 = require("passport");
var axios_1 = require("axios");
var needle_1 = require("needle");
var cors_1 = require("cors");
(0, dotenv_1.config)();
var corsOptions = {
    origin: '*',
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
};
var port = process.env.PORT || 3000;
var IPSTACK_API_KEY = process.env.IPSTACK_API_KEY || "";
// async function getGeoInfo(ip: string): Promise<any> {
//   try {
//       const response = await axios.get(`http://api.ipstack.com/${ip}?access_key=${IPSTACK_API_KEY}`);
//       return response.data;
//   } catch (error) {
//       console.error('Error fetching geo information:', error);
//       throw new Error('Error fetching geo information');
//   }
// }
function getUserTwitterData(username) {
    return __awaiter(this, void 0, void 0, function () {
        var token, endpointURL, params, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = process.env.BEARER_TOKEN;
                    endpointURL = "https://api.twitter.com/2/users/by?usernames=";
                    params = {
                        usernames: username,
                        "user.fields": "created_at,name,connection_status,public_metrics"
                    };
                    return [4 /*yield*/, (0, needle_1.default)('get', endpointURL, params, {
                            headers: {
                                "User-Agent": "v2UserLookupJS",
                                "authorization": "Bearer ".concat(token)
                            }
                        })];
                case 1:
                    res = _a.sent();
                    if (res.body) {
                        // console.dir(res, {
                        //   depth: null
                        // });
                        return [2 /*return*/, res.body];
                    }
                    else {
                        throw new Error('Unsuccessful request');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
var getUserLatestTweetData = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
    var url, token, params, options, resp;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "https://api.twitter.com/2/users/".concat(userId, "/tweets");
                token = process.env.BEARER_TOKEN;
                params = {
                    "tweet.fields": "created_at",
                    "expansions": "author_id"
                };
                options = {
                    headers: {
                        "User-Agent": "v2UserTweetsJS",
                        "authorization": "Bearer ".concat(token)
                    }
                };
                return [4 /*yield*/, (0, needle_1.default)('get', url, params, options)];
            case 1:
                resp = _a.sent();
                return [2 /*return*/, resp.body.data[0].text];
        }
    });
}); };
passport_1.default.serializeUser(function (user, done) {
    done(null, user);
});
passport_1.default.deserializeUser(function (obj, done) {
    done(null, obj);
});
var app = (0, express_1.default)();
app.use((0, cors_1.default)(corsOptions));
app.use(passport_1.default.initialize());
app.use((0, express_session_1.default)({ secret: 'keyboard cat', resave: false, saveUninitialized: true }));
// app.use(async (req: Request, res: Response, next) => {
//   const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//   if (typeof clientIp === 'string') {
//       try {
//           const geoInfo = await getGeoInfo(clientIp);
//           console.log(`IP: ${clientIp}, Country Code: ${geoInfo.country_code}`);
//           req['countryCode'] = geoInfo.country_code; 
//       } catch (error) {
//           console.error(error);
//       }
//   }
//   next();
// });
// app.get('/ip-geo-blocking', (req: Request, res: Response) => {
//   res.send(`Hello! Your country code is: ${req['countryCode']}`);
// });
app.get('/', function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            passport_1.default.use(new passport_twitter_oauth2_1.Strategy({
                clientID: process.env.TWITTER_CLIENT_ID,
                clientSecret: process.env.TWITTER_CLIENT_SECRET,
                clientType: 'confidential',
                callbackURL: "https://boom-dao-twitter-auth.up.railway.app/authorized?userId=".concat(req.query.userId),
            }, function (accessToken, refreshToken, profile, done) {
                return done(null, profile);
            }));
            res.redirect("https://boom-dao-twitter-auth.up.railway.app/x/authentication");
            return [2 /*return*/];
        });
    });
});
app.get('/x/authentication', passport_1.default.authenticate('twitter', {
    scope: ['tweet.read', 'users.read', 'offline.access'],
}));
app.get('/authorized', passport_1.default.authenticate('twitter'), function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var userData, data, uid, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    userData = JSON.stringify(req.user, undefined, 2);
                    data = JSON.parse(userData);
                    uid = req.query.userId;
                    console.log(uid);
                    return [4 /*yield*/, axios_1.default.post(process.env.UPDATE_URL ? process.env.UPDATE_URL : "", {}, {
                            headers: {
                                'authorization': process.env.KEY,
                                'tid': data.id,
                                'uid': String(uid),
                                'tusername': String(data.username)
                            }
                        })];
                case 1:
                    response = _a.sent();
                    if (response.status == 200) {
                        res.end("<div style=\"text-align: center;\">\n        <p style=\"font-family: monospace; text-align: center; margin-top: 120px; font-size: 35px; font-weight: 900;\">Your Twitter account linked to BOOM Gaming Guild successfully</p>\n        <p style=\"font-size: 20px;font-family: monospace;\">Please Click on button below to redirect and complete Quest.</p>\n        <button style=\"width: 200px; height: 50px; font-weight: bold; text-align: center; border-radius: 5px; background-color:lightblue;\">\n        <a href=\"https://awcae-maaaa-aaaam-abmyq-cai.icp0.io/\" style=\"text-decoration: none; font-size: 15px; color: black; font-weight: bold; text-align: center; height: auto; padding: 3px 0;\">\n            BOOM GAMING GUILD\n            </a>\n        </button>\n        </div>");
                    }
                    else {
                        res.end("<h1>".concat(response.data, "</h1>"));
                    }
                    return [2 /*return*/];
            }
        });
    });
});
app.post('/check-twitter-quest-status', function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var auth, tusername, tuserid, principal, actionId, user_data, tweet_data, followers_count, tweet_count, like_count, created_at, response, response, response, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    auth = req.headers['Authorization'];
                    if (auth != process.env.key) {
                        res.status(404).end();
                    }
                    tusername = req.headers['tusername'];
                    tuserid = req.headers['tuserid'];
                    principal = req.headers['principalid'];
                    actionId = req.headers['actionid'];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, , 11]);
                    return [4 /*yield*/, getUserTwitterData(String(tusername))];
                case 2:
                    user_data = _a.sent();
                    return [4 /*yield*/, getUserLatestTweetData(String(tuserid))];
                case 3:
                    tweet_data = _a.sent();
                    followers_count = user_data.data[0].public_metrics.followers_count;
                    tweet_count = user_data.data[0].public_metrics.tweet_count;
                    like_count = user_data.data[0].public_metrics.like_count;
                    created_at = String(user_data.data[0].created_at);
                    created_at = created_at.substring(0, 4);
                    if (!(followers_count >= 50 && Number(created_at) <= 2023 && String(tweet_data).includes("#BOOMGUILD"))) return [3 /*break*/, 5];
                    return [4 /*yield*/, axios_1.default.post(process.env.PROCESS_ACTION_AS_ADMIN_URL ? process.env.PROCESS_ACTION_AS_ADMIN_URL : "", {}, {
                            headers: {
                                'authorization': process.env.KEY,
                                'aid': actionId,
                                'uid': principal,
                            }
                        })];
                case 4:
                    response = _a.sent();
                    if (response.status == 200) {
                        res.status(200).send({ msg: 'Your twitter post has been verified and quest rewards have been processed' });
                        res.status(200).end();
                    }
                    else {
                        res.status(401).send({ msg: 'Your tweet has been verified but some error occured in server, report this incident to dev team in discord' });
                        res.status(401).end();
                    }
                    return [3 /*break*/, 9];
                case 5:
                    if (!String(tweet_data).includes("#BOOMGUILD")) return [3 /*break*/, 7];
                    return [4 /*yield*/, axios_1.default.post(process.env.PROCESS_ACTION_AS_ADMIN_URL ? process.env.PROCESS_ACTION_AS_ADMIN_URL : "", {}, {
                            headers: {
                                'authorization': process.env.KEY,
                                'aid': "remove_entity_" + actionId,
                                'uid': principal,
                            }
                        })];
                case 6:
                    response = _a.sent();
                    if (response.status == 200) {
                        res.status(202).send({ msg: 'Your twitter account does not meet the minimum requirements to complete this Quest, contact dev team for support.' });
                        res.status(202).end();
                    }
                    else {
                        res.status(402).send({ msg: 'Your twitter does not meet the minimum requirements and we could not process this report back as some error occured in server, report this incident to dev team in discord' });
                        res.status(402).end();
                    }
                    return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, axios_1.default.post(process.env.PROCESS_ACTION_AS_ADMIN_URL ? process.env.PROCESS_ACTION_AS_ADMIN_URL : "", {}, {
                        headers: {
                            'authorization': process.env.KEY,
                            'aid': "remove_entity_" + actionId,
                            'uid': principal,
                        }
                    })];
                case 8:
                    response = _a.sent();
                    if (response.status == 200) {
                        res.status(202).send({ msg: 'We could not verify the tweet which your were supposed to do in order to complete this Quest, contact dev team for support.' });
                        res.status(202).end();
                    }
                    else {
                        res.status(402).send({ msg: 'We could not verify the tweet as some error occured in server, report this incident to dev team in discord' });
                        res.status(402).end();
                    }
                    _a.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    e_1 = _a.sent();
                    res.send({ msg: e_1 });
                    res.status(404).end();
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
});
app.post('/grant-twitter-quest-entity', function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var auth, principal, response, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    auth = req.headers['Authorization'];
                    if (auth != process.env.key) {
                        res.status(404).end();
                    }
                    principal = req.headers['uid'];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.post(process.env.GRANT_TWITTER_QUEST_ENTITY_URL ? process.env.GRANT_TWITTER_QUEST_ENTITY_URL : "", {}, {
                            headers: {
                                'authorization': process.env.KEY,
                                'uid': principal,
                            }
                        })];
                case 2:
                    response = _a.sent();
                    res.end();
                    return [3 /*break*/, 4];
                case 3:
                    e_2 = _a.sent();
                    res.send({ msg: e_2 });
                    res.status(404).end();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
});
app.post('/set-user-discord-details', function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var auth, principal, name, response, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    auth = req.headers['Authorization'];
                    if (auth != process.env.key) {
                        res.status(404).end();
                    }
                    principal = req.headers['uid'];
                    name = req.headers['tusername'];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.post(process.env.DISCORD_UPDATE_URL ? process.env.DISCORD_UPDATE_URL : "", {}, {
                            headers: {
                                'authorization': process.env.KEY,
                                'uid': principal,
                                'tusername': name
                            }
                        })];
                case 2:
                    response = _a.sent();
                    res.end();
                    return [3 /*break*/, 4];
                case 3:
                    e_3 = _a.sent();
                    res.send({ msg: e_3 });
                    res.status(404).end();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
});
// Discord events listener
// const token = process.env.BOT_TOKEN || "";
// const permission: PermissionResolvable = "ManageRoles";
// const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
// const rest = new REST({ version: '9' }).setToken(token);
// client.once('ready', () => {
//   console.log(`Logged : ${client.user?.tag}!`);
// });
// client.on('messageCreate', async message => {
//   if (message.content.includes('BOOM DAO') && message.content.length >= 10) {
//     let sender_name = message.author.username;
//     if (message.author.bot) {
//       return message.reply('bot accounts not allowed to post here');
//     }
//     const url = process.env.UID_DISCORD_FETCH_URL || "";
//     const res = await axios.post(url, {}, {
//       headers: {
//         'key': process.env.KEY,
//         'tusername': String(sender_name)
//       }
//     })
//     let sender_uid = res.data;
//     if (sender_uid == "") {
//       return message.reply(`Hey ${sender_name}! You can authenticate your discord account on BOOM Gaming Guilds now and complete Quests to win rewards!`);
//     }
//     const response = await axios.post(process.env.PROCESS_ACTION_AS_ADMIN_URL ? process.env.PROCESS_ACTION_AS_ADMIN_URL : "", {}, {
//       headers: {
//         'key': process.env.KEY,
//         'aid': "grant_discord_post",
//         'uid': sender_uid,
//       }
//     })
//     if (response.status == 200) {
//       message.reply(`Hey ${sender_name}! Thank you for your kind words. We welcome you to BOOM Gaming Guild and appreciate all the feedbacks!`);
//     }
//   } else if (message.content.includes('/Grant #')) {
//     if (!message.member?.permissions.has(permission)) {
//       return message.reply('no permission to manage roles.');
//     }
//     let guildId = process.env.GUILD_ID || "";
//     let sender_name = message.author.username;
//     let sender_did = message.author.id;
//     if (message.author.bot) {
//       return message.reply('bot accounts not allowed to post here');
//     }
//     const url = process.env.UID_DISCORD_FETCH_URL || "";
//     const res = await axios.post(url, {}, {
//       headers: {
//         'key': process.env.KEY,
//         'tusername': String(sender_name)
//       }
//     })
//     let sender_uid = res.data;
//     const guild = await client.guilds.fetch(guildId);
//     const roles = await guild.roles.fetch();
//     const role_to_be_granted = message.content.split("#")[1];
//     const roleId = guild.roles.cache.find(r => r.name === role_to_be_granted)?.id;
//     if (sender_uid == "") {
//       return message.reply(`Hey ${sender_name}! You can authenticate your discord account on BOOM Gaming Guilds now and complete Quests to win rewards!`);
//     }
//     try {
//       if(roleId) {
//         const res = await axios.post(process.env.FETCH_ENTITY_FROM_UID_URL || "", {}, {
//           headers: {
//             'key': process.env.KEY,
//             'uid': String(sender_uid),
//             'eid': "xp"
//           }
//         });
//         let xp_amt = res.data.xp.split(".")[0];
//         if(Number(xp_amt) >= 10000) {
//           await rest.put(
//             Routes.guildMemberRole(message.guild ? message.guild.id : '', sender_did, roleId),
//             { headers: { Authorization: `Bot ${client.token}` } }
//           );
//           message.reply(`Assigned role <@&${roleId}> to <@${sender_name}>.`);
//         } else {
//           message.reply(`Hey <@${sender_name}>, looks like you have not reached to 10,000 Guild XP yet, Play more BGG Games.`);
//         }
//       } else {
//         throw ("This Role does not exist.");
//       }
//     } catch (error) {
//       console.error(`Failed : ${error}`);
//       message.reply('Failed to assign role.');
//     }
//   }
// });
// client.login(token);
app.use(express_1.default.static('/dist'));
app.listen(port, function () { console.log("listening on " + { port: port }); });
