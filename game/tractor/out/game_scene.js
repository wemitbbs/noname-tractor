import { MainForm } from "./main_form.js";
import { Coordinates } from "./coordinates.js";
import { CommonMethods } from "./common_methods.js";
import { IDBHelper } from "./idb_helper.js";
import { EnterHallInfo } from './enter_hall_info.js';
var dummyValue = "dummyValue";
var IPPort = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):(6553[0-5]|655[0-2][0-9]|65[0-4][0-9][0-9]|6[0-4][0-9][0-9][0-9][0-9]|[1-5](\d){4}|[1-9](\d){0,3})$/;
var GameScene = /** @class */ (function () {
    function GameScene(irm, hostName, playerName, nickNameOverridePass, playerEmail, gameIn, libIn, uiIn, getIn, _statusIn) {
        // // public hallPlayerHeader: Phaser.GameObjects.Text
        // // public hallPlayerNames: Phaser.GameObjects.Text[]
        // // public btnJoinAudio: Phaser.GameObjects.Text
        // // public btnQiandao: Phaser.GameObjects.Text
        // public joinAudioUrl: string 
        this.nickNameOverridePass = "";
        this.playerEmail = "";
        this.noChat = false;
        this.useCardUIStyleClassic = false;
        this.hidePlayerID = false;
        this.wsprotocal = "wss";
        this.clientVersion = "";
        this.game = gameIn;
        this.lib = libIn;
        this.ui = uiIn;
        this.get = getIn;
        this._status = _statusIn;
        this.isReplayMode = irm;
        // // this.existPlayers = [1]
        // // this.websocket = null
        // // this.getPlayerMsgCnt = 0
        // // this.prepareOkImg = [null, null, null, null]
        // // this.pokerTableChairImg = []
        // // this.pokerTableChairNames = []
        this.cardImages = [];
        this.cardServerNumToImage = {};
        for (var i = 0; i < 54; i++) {
            this.cardServerNumToImage[i] = [];
        }
        this.cardImageSequence = [];
        this.toolbarSuiteImages = [];
        this.sidebarImages = [];
        this.scoreCardsImages = [];
        this.scoreCardsIntsDrawn = [];
        this.last8CardsImages = [];
        this.showedCardImages = [];
        this.overridingLabelImages = [
            "bagua",
            "zhugong",
            "sha",
            "huosha",
            "leisha",
        ];
        this.overridingLabelAnims = [
            ["", ""],
            ["", ""],
            ["effect_qinggangjian", undefined],
            ["effect_shoujidonghua", "play3"],
            ["effect_shoujidonghua", "play5"]
        ];
        // // this.hallPlayerNames = [];
        this.clientMessages = [];
        this.danmuMessages = [];
        this.noDongtu = "false";
        this.useCardUIStyleClassic = (this.lib && this.lib.config && this.lib.config.useCardUIStyleClassic) ? this.lib.config.useCardUIStyleClassic : false;
        this.hidePlayerID = (this.lib && this.lib.config && this.lib.config.hidePlayerID) ? this.lib.config.hidePlayerID : false;
        this.noDanmu = (this.lib && this.lib.config && this.lib.config.noDanmu) ? this.lib.config.noDanmu : "false";
        this.noTouchDevice = (this.lib && this.lib.config && this.lib.config.noTouchDevice) ? this.lib.config.noTouchDevice : "false";
        this.noCutCards = (this.lib && this.lib.config && this.lib.config.noCutCards) ? this.lib.config.noCutCards : "false";
        this.yesDragSelect = (this.lib && this.lib.config && this.lib.config.yesDragSelect) ? this.lib.config.yesDragSelect : "false";
        this.onlyMeShowCardCancelLastTrickView = (this.lib && this.lib.config && this.lib.config.onlyMeShowCardCancelLastTrickView) ? this.lib.config.onlyMeShowCardCancelLastTrickView : "false";
        this.chatMessageCostNoted = (this.lib && this.lib.config && this.lib.config.chatMessageCostNoted !== undefined) ? this.lib.config.chatMessageCostNoted : false;
        this.yesFirstPersonView = (this.lib && this.lib.config && this.lib.config.yesFirstPersonView) ? this.lib.config.yesFirstPersonView : "false";
        this.qiangliangMin = (this.lib && this.lib.config && this.lib.config.qiangliangMin) ? this.lib.config.qiangliangMin : "5";
        this.clientVersion = (this.lib && this.lib.version) ? this.lib.version : CommonMethods.PLAYER_ENTER_HALL_VERSION_UNKNOWN;
        // // if (this.qiangliangMin === undefined) this.qiangliangMin = '5'
        IDBHelper.maxReplays = (this.lib && this.lib.config && this.lib.config.maxReplays) ? this.lib.config.maxReplays : IDBHelper.maxReplays;
        this.coordinates = new Coordinates(this);
        this.hasConnectedOnce = false;
        this.initialRetryCount = 0;
        if (this.isReplayMode) {
            this.doReplay();
            return;
        }
        this.hostName = hostName.trim();
        if (!this.hostName) {
            this.hostName = "localhost:8081";
        }
        this.hostNameOriginal = this.hostName;
        this.playerName = playerName.trim();
        if (this.playerName && CommonMethods.IsNumber(this.playerName)) {
            document.body.innerHTML = "<div>!!! 昵称不能以数字开头结尾：".concat(this.playerName, "</div>");
            this.hostName = "";
            return;
        }
        var isIPPort = IPPort.test(this.hostName) || this.hostName.includes("localhost") || this.hostName.includes("/");
        if (isIPPort) {
            this.wsprotocal = window.location.protocol === "https:" ? "wss" : "ws";
        } else {
            if (!(/(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)*\.?(:\d+)?(\/.*)?$)/gi.test(this.hostName)) && !this.processAuth()) {
                document.body.innerHTML = "<div>!!! 解析服务器地址失败，请确认输入信息无误：".concat(this.hostNameOriginal, "</div>");
                this.hostName = "";
                return;
            }
            if (!this.hostName.includes("localhost") && this.hostName.includes(":")) {
                this.resolveUrl();
            }
        }
        this.nickNameOverridePass = nickNameOverridePass;
        this.playerEmail = playerEmail;
        this.soundPool = {};
        this.loadAudioFiles();
        // 核心优化：仅在初次进入场景时执行 Session 刷新，重连不刷
        this.connectServer(true, true);
    }
    // 核心优化：针对共享主机，通过 HTTP 唤醒后再进行 WSS 连接
    // refreshSession 为 true 时先敲一下 PHP 刷新 phpBB Session Cookie
    // proceedToConnect 为 true 时在唤醒后自动执行 WSS 连接
    GameScene.prototype.connectServer = function (refreshSession, proceedToConnect) {
        var _this = this;
        var timestamp = Date.now();
        var httpUrl = "".concat(window.location.protocol, "//").concat(this.hostName, "?t=").concat(timestamp);

        // 内部流程：唤醒 Node.js 并连接
        var doNodeWakeupAndConnect = function () {
            fetch(httpUrl, { mode: 'no-cors' }).then(function () {
                if (proceedToConnect) _this.connect();
            }).catch(function () {
                if (proceedToConnect) _this.connect();
            });
        };

        if (refreshSession) {
            // 只有初次进入大厅才刷新 Session
            var phpUrl = "refresh_session.php?t=" + timestamp;
            fetch(phpUrl).then(doNodeWakeupAndConnect).catch(doNodeWakeupAndConnect);
        } else {
            // 重连或心跳：直接敲 Node.js
            doNodeWakeupAndConnect();
        }
    };
    // non-replay mode, online
    GameScene.prototype.connect = function () {
        if (!this.hostName || (this.websocket && this.websocket.readyState === WebSocket.CONNECTING))
            return;
        try {
            if (this.websocket) {
                this.websocket.close();
                delete this.websocket;
            }
            this.websocket = new WebSocket("".concat(this.wsprotocal, "://").concat(this.hostName));
            this.websocket.gs = this;
            var _this = this;
            this.websocket.onopen = function () {
                _this.hasConnectedOnce = true;
                _this.initialRetryCount = 0;

                // 核心修复：建立 HTTP 定时心跳，防止 Passenger 进入待机模式
                if (_this.httpKeepAliveTimer) clearInterval(_this.httpKeepAliveTimer);
                _this.httpKeepAliveTimer = setInterval(function () {
                    // 心跳阶段只需单纯发送 HTTP 请求保活，无需刷新 Session，也无需重复触发 connect()
                    _this.connectServer(false, false);
                }, 30000); // 每 30 秒发一次 HTTP 请求保持活跃

                // 核心修复：连接成功后，清理重连状态和 UI
                if (_this.reconnectTimer) {
                    clearInterval(_this.reconnectTimer);
                    _this.reconnectTimer = null;
                }
                var overlay = document.getElementById('reconnect-overlay');
                if (overlay) overlay.remove();
                _this.reconnecting = false;

                // 核心修复：利用引擎标准方法清理 Splash 界面 (包含欢迎语和状态文本)
                this.gs.game.clearConnect();

                // empty password means recover password or playerName
                if (!this.gs.nickNameOverridePass) {
                    this.gs.nickNameOverridePass = CommonMethods.recoverLoginPassFlag;
                    if (!this.gs.playerName) {
                        this.gs.playerName = "";
                    }
                }
                var enterHallInfo = new EnterHallInfo(this.gs.nickNameOverridePass, this.gs.playerEmail, "".concat(CommonMethods.PLAYER_CLIENT_TYPE_TLJAPP).concat(CommonMethods.PLAYER_ENTER_HALL_DELIMITER).concat(this.gs.clientVersion));
                
                // 核心修复：前端主动从 Cookie 中抓取 sid 并随消息发送。
                // 这样即使 WebSocket 握手 Header 里的 Cookie 被代理拦截，后端也能通过 Body 拿到 sid 进行认证。
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var c = cookies[i].trim();
                    if (c.indexOf('_sid=') !== -1) {
                        enterHallInfo.sid = c.split('=')[1];
                        break;
                    }
                }

                this.gs.sendMessageToServer(CommonMethods.PLAYER_ENTER_HALL_REQUEST, this.gs.playerName, JSON.stringify(enterHallInfo));
                
                // 如果是重连，不要重新创建 MainForm，否则会造成 UI 重叠和事件监听冲突
                if (!this.gs.mainForm) {
                    this.gs.mainForm = new MainForm(this.gs);
                }
                
                CommonMethods.BuildCardNumMap();
                IDBHelper.InitIDB(function () { void (0); });
            };
            this.websocket.onmessage = function (message) {
                // ... rest of onmessage ...
                var data = JSON.parse(message.data);
                var messageType = data["messageType"];
                var playerID = data["playerID"];
                var content = data["content"];
                var objList = JSON.parse(content);
                if (objList == null || objList.length == 0)
                    return;
                if (messageType != CommonMethods.NotifyPing_RESPONSE) {
                    console.log("received messageType: ".concat(messageType));
                }
                switch (messageType) {
                    case CommonMethods.NotifyGameHall_RESPONSE:
                        this.gs.handleNotifyGameHall(objList);
                        break;
                    case CommonMethods.NotifyOnlinePlayerList_RESPONSE:
                        this.gs.handleNotifyOnlinePlayerList(playerID, objList);
                        break;
                    case CommonMethods.NotifyGameRoomPlayerList_RESPONSE:
                        this.gs.handleNotifyGameRoomPlayerList(playerID, objList);
                        break;
                    case CommonMethods.NotifyMessage_RESPONSE:
                        this.gs.handleNotifyMessage(objList);
                        break;
                    case CommonMethods.NotifyRoomSetting_RESPONSE:
                        this.gs.handleNotifyRoomSetting(objList);
                        break;
                    case CommonMethods.NotifyGameState_RESPONSE:
                        this.gs.handleNotifyGameState(objList);
                        break;
                    case CommonMethods.NotifyCurrentHandState_RESPONSE:
                        this.gs.handleNotifyCurrentHandState(objList);
                        break;
                    case CommonMethods.NotifyCurrentTrickState_RESPONSE:
                        this.gs.handleNotifyCurrentTrickState(objList);
                        break;
                    case CommonMethods.GetDistributedCard_RESPONSE:
                        this.gs.handleGetDistributedCard(objList);
                        break;
                    case CommonMethods.NotifyCardsReady_RESPONSE:
                        this.gs.handleNotifyCardsReady(objList);
                        break;
                    case CommonMethods.NotifyDumpingValidationResult_RESPONSE:
                        this.gs.handleNotifyDumpingValidationResult(objList);
                        break;
                    case CommonMethods.NotifyTryToDumpResult_RESPONSE:
                        this.gs.handleNotifyTryToDumpResult(objList);
                        break;
                    case CommonMethods.NotifyStartTimer_RESPONSE:
                        this.gs.handleNotifyStartTimer(objList);
                        break;
                    case CommonMethods.NotifyEmoji_RESPONSE:
                        this.gs.handleNotifyEmoji(objList);
                        break;
                    case CommonMethods.CutCardShoeCards_RESPONSE:
                        this.gs.handleCutCardShoeCards();
                        break;
                    case CommonMethods.NotifyReplayState_RESPONSE:
                        this.gs.handleNotifyReplayState(objList);
                        break;
                    case CommonMethods.NotifyPing_RESPONSE:
                        this.gs.handleNotifyPing_RESPONSE();
                        break;
                    case CommonMethods.NotifyDaojuInfo_RESPONSE:
                        this.gs.handleNotifyDaojuInfo(objList);
                        break;
                    default:
                        break;
                }
            };
            this.websocket.onerror = function (e) {
                if (_this.httpKeepAliveTimer) {
                    clearInterval(_this.httpKeepAliveTimer);
                    _this.httpKeepAliveTimer = null;
                }
                if (_this.reconnecting || _this.isKicked) return;
                console.error("WS Error:", e);
                _this.reconnect();
            };
            this.websocket.onclose = function (e) {
                if (_this.httpKeepAliveTimer) {
                    clearInterval(_this.httpKeepAliveTimer);
                    _this.httpKeepAliveTimer = null;
                }
                if (_this.reconnecting || _this.isKicked) return;
                console.log("WS closed by the server. ", e.code, e.reason);
                _this.reconnect();
            };
        }
        catch (e) {
            this.reconnect();
        }
    };
    GameScene.prototype.reconnect = function () {
        var _this = this;
        if (this.reconnectTimer) return;
        this.reconnecting = true;
        
        // 核心修复：断线时立即清理所有 UI 倒计时，防止“灵异托管”
        if (this.mainForm) {
            this.mainForm.ClearTimer();
            this.stopAudio(CommonMethods.audioCountdown8Sec);
            // 隐藏所有座位的进度条
            if (this.ui.gameRoomImagesChairOrPlayer) {
                this.ui.gameRoomImagesChairOrPlayer.forEach(function (ui) { if (ui && ui.hideTimer) ui.hideTimer(); });
            }
        }

        // 显示重连 UI
        if (this.hasConnectedOnce) {
            var overlay = document.getElementById('reconnect-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'reconnect-overlay';
                overlay.style.position = 'fixed'; overlay.style.top = '0'; overlay.style.left = '0';
                overlay.style.width = '100%'; overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
                overlay.style.color = 'white'; overlay.style.display = 'flex';
                overlay.style.flexDirection = 'column'; overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center'; overlay.style.zIndex = '100000';
                overlay.style.fontFamily = 'xinwei, "Microsoft YaHei"';
                overlay.innerHTML = '<h2 style="font-size:30px;margin-bottom:20px;">与服务器连接断开</h2>' +
                                    '<p style="font-size:18px;margin-bottom:30px;">正在尝试自动重连，请稍候...</p>' +
                                    '<div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #3498db;border-radius:50%;animation:spin 1s linear infinite;"></div>' +
                                    '<style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';
                document.body.appendChild(overlay);
            }
        }

        this.reconnectTimer = setInterval(function () {
            if (!_this.hasConnectedOnce) {
                _this.initialRetryCount++;
                if (_this.initialRetryCount >= 3) {
                    clearInterval(_this.reconnectTimer);
                    _this.reconnectTimer = null;
                    
                    // 核心修复：完全同步 MainForm.showOfflineScreen 的视觉风格
                    var overlay = document.createElement("div");
                    overlay.style.position = "fixed";
                    overlay.style.top = "0";
                    overlay.style.left = "0";
                    overlay.style.width = "100%";
                    overlay.style.height = "100%";
                    overlay.style.background = "rgba(0,0,0,0.65)";
                    overlay.style.zIndex = "200000";
                    overlay.style.display = "flex";
                    overlay.style.flexDirection = "column";
                    overlay.style.justifyContent = "center";
                    overlay.style.alignItems = "center";
                    overlay.style.fontFamily = 'xinwei, "Microsoft YaHei"';

                    var text = document.createElement("div");
                    text.innerText = "!!! 尝试连接服务器出错，请确认网络连接及服务器地址无误：" + _this.hostNameOriginal;
                    text.style.fontSize = "30px";
                    text.style.color = 'white';
                    text.style.textShadow = '2px 2px 4px black';
                    text.style.textAlign = "center";
                    text.style.marginBottom = "20px";
                    overlay.appendChild(text);

                    var btn = document.createElement("div");
                    btn.className = "menubutton highlight large";
                    btn.innerText = "重试";
                    btn.style.marginTop = "200px";
                    btn.style.cursor = "pointer";
                    btn.onclick = function() { window.location.reload(); };
                    overlay.appendChild(btn);

                    if (_this.ui.emailtext) _this.ui.emailtext.style.display = 'none';
                    document.body.appendChild(overlay);
                    return;
                }
            }
            console.log("Attempting to reconnect...");
            // 核心增强：在重连时预先发送 HTTP 唤醒请求，并在请求完成后再进行 WS 连接，确保共享主机进程被激活
            _this.connectServer(false, true);
            }, 3000);
    };
    // replay mode, offline
    GameScene.prototype.doReplay = function () {
        var _this = this;
        this.mainForm = new MainForm(this);
        this.mainForm.drawFrameMain();
        this.mainForm.drawGameRoom();
        this.mainForm.drawFrameChat();
        CommonMethods.BuildCardNumMap();
        this.mainForm.LoadUIUponConnect();
        IDBHelper.InitIDB(function () {
            _this.mainForm.DoReplayMainForm();
        });
    };
    // public handleNotifyUpdateGobang_RESPONSE(objList) {
    //     var result: SGGBState = objList[0];
    //     this.mainForm.sgDrawingHelper.NotifyUpdateGobang(result);
    // }
    GameScene.prototype.handleNotifyDaojuInfo = function (objList) {
        var daojuInfo = objList[0];
        var updateQiandao = objList[1];
        var updateSkin = objList[2];
        this.mainForm.tractorPlayer.NotifyDaojuInfo(daojuInfo, updateQiandao, updateSkin);
    };
    // public handleNotifyGrabStar_RESPONSE(objList) {
    //     let playerIndex: number = objList[0];
    //     let starIndex: number = objList[1];
    //     this.mainForm.sgDrawingHelper.NotifyGrabStar(playerIndex, starIndex);
    // }
    // public handleNotifyCreateCollectStar_RESPONSE(objList) {
    //     var result: SGCSState = objList[0];
    //     this.mainForm.sgDrawingHelper.NotifyCreateCollectStar(result);
    // }
    // public handleNotifyEndCollectStar(objList) {
    //     var result: SGCSState = objList[0];
    //     this.mainForm.sgDrawingHelper.NotifyEndCollectStar(result);
    // }
    // public handleNotifySgcsPlayerUpdated_RESPONSE(objList) {
    //     var result: SGCSPlayer = JSON.parse(objList[0])
    //     this.mainForm.sgDrawingHelper.NotifySgcsPlayerUpdated(result);
    // }
    GameScene.prototype.handleNotifyPing_RESPONSE = function () {
        this.mainForm.tractorPlayer.NotifyPing();
    };
    GameScene.prototype.handleNotifyReplayState = function (objList) {
        var result = objList[0];
        IDBHelper.SaveReplayEntity(result, function () { void (0); });
    };
    GameScene.prototype.handleCutCardShoeCards = function () {
        this.mainForm.CutCardShoeCardsEventHandler();
    };
    GameScene.prototype.handleNotifyEmoji = function (objList) {
        this.mainForm.NotifyEmojiEventHandler.apply(this.mainForm, objList);
    };
    GameScene.prototype.handleNotifyStartTimer = function (objList) {
        var timerLength = objList[0];
        var playerID = objList[1];
        this.mainForm.NotifyStartTimerEventHandler(timerLength, playerID);
    };
    GameScene.prototype.handleNotifyDumpingValidationResult = function (objList) {
        var result = objList[0];
        this.mainForm.NotifyDumpingValidationResultEventHandler(result);
    };
    GameScene.prototype.handleNotifyTryToDumpResult = function (objList) {
        var result = objList[0];
        this.mainForm.NotifyTryToDumpResultEventHandler(result);
    };
    GameScene.prototype.handleNotifyCardsReady = function (objList) {
        var cardsReady = objList[0];
        this.mainForm.tractorPlayer.NotifyCardsReady(cardsReady);
    };
    GameScene.prototype.handleGetDistributedCard = function (objList) {
        var cardNumber = objList[0];
        this.mainForm.tractorPlayer.GetDistributedCard(cardNumber);
    };
    GameScene.prototype.handleNotifyGameHall = function (objList) {
        var roomStateList = objList[0];
        var playerList = objList[1];
        var yuezhanList = objList[2];
        this.mainForm.NotifyGameHallEventHandler(roomStateList, playerList, yuezhanList);
    };
    GameScene.prototype.handleNotifyOnlinePlayerList = function (playerID, objList) {
        var isJoining = objList[0];
        this.mainForm.NotifyOnlinePlayerListEventHandler(playerID, isJoining);
    };
    GameScene.prototype.handleNotifyGameRoomPlayerList = function (playerID, objList) {
        var isJoining = objList[0];
        var roomName = objList[1];
        this.mainForm.NotifyGameRoomPlayerListEventHandler(playerID, isJoining, roomName);
    };
    GameScene.prototype.handleNotifyMessage = function (objList) {
        var msgs = objList[0];
        this.mainForm.tractorPlayer.NotifyMessage(msgs);
    };
    GameScene.prototype.handleNotifyRoomSetting = function (objList) {
        var roomSetting = objList[0];
        var showMessage = objList[1];
        this.mainForm.tractorPlayer.NotifyRoomSetting(roomSetting, showMessage);
    };
    GameScene.prototype.handleNotifyGameState = function (objList) {
        var gameState = objList[0];
        var notifyType = objList[1];
        this.mainForm.tractorPlayer.NotifyGameState(gameState, notifyType);
    };
    GameScene.prototype.handleNotifyCurrentHandState = function (objList) {
        var currentHandState = objList[0];
        var notifyType = objList[1];
        this.mainForm.tractorPlayer.NotifyCurrentHandState(currentHandState, notifyType);
    };
    GameScene.prototype.handleNotifyCurrentTrickState = function (objList) {
        var currentTrickState = objList[0];
        var notifyType = objList[1];
        this.mainForm.tractorPlayer.NotifyCurrentTrickState(currentTrickState, notifyType);
    };
    GameScene.prototype.processAuth = function () {
        try {
            var bytes = CryptoJS.AES.decrypt(this.hostName, dummyValue);
            var originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (bytes && bytes.sigBytes > 0 && originalText) {
                this.hostName = originalText;
                return true;
            }
        }
        catch (ex) {
            console.log("===");
            console.log(ex);
        }
        return false;
    };
    GameScene.prototype.resolveUrl = function () {
        try {
            var urlParts = this.hostName.split(":");
            var urlPart1 = "";
            for (var i = 0; i < urlParts[0].length; i++) {
                var ascii = urlParts[0].charCodeAt(i);
                var char = String.fromCharCode(ascii);
                urlPart1 += char;
            }
            this.hostName = "".concat(urlPart1, ":").concat(urlParts[1]);
            return true;
        }
        catch (ex) {
            console.log("===");
            console.log(ex);
        }
        return false;
    };
    GameScene.prototype.loadAudioFiles = function () {
        this.soundPlayersShowCard = [
            { "m": this.ui.audioResources.equip1, "f": this.ui.audioResources.equip1 },
            { "m": this.ui.audioResources.equip2, "f": this.ui.audioResources.equip2 },
            { "m": this.ui.audioResources.zhu_junlve, "f": this.ui.audioResources.zhu_lijian2 },
            { "m": this.ui.audioResources.sha, "f": this.ui.audioResources.f_sha },
            { "m": this.ui.audioResources.sha_fire, "f": this.ui.audioResources.f_sha_fire },
            { "m": this.ui.audioResources.sha_thunder, "f": this.ui.audioResources.f_sha_thunder },
        ];
        this.soundPool[CommonMethods.audioLiangpai] = { "m": this.ui.audioResources.liangpai_m_shelie1, "f": this.ui.audioResources.liangpai_f_biyue1 };
        this.soundPool[CommonMethods.audioShuaicuo] = { "m": this.ui.audioResources.shuaicuo_m_fankui2, "f": this.ui.audioResources.shuaicuo_f_guose2 };
        this.soundPool[CommonMethods.audioRecoverhp] = this.ui.audioResources.recover;
        this.soundPool[CommonMethods.audioDraw] = this.ui.audioResources.draw;
        this.soundPool[CommonMethods.audioDrawx] = this.ui.audioResources.drawx;
        this.soundPool[CommonMethods.audioTie] = this.ui.audioResources.tie;
        this.soundPool[CommonMethods.audioWin] = this.ui.audioResources.win;
        this.soundPool[CommonMethods.audioGameStart] = this.ui.audioResources.game_start;
        this.soundPool[CommonMethods.audioEnterHall] = this.ui.audioResources.enter_hall_click;
        this.soundPool[CommonMethods.audioCountdown8Sec] = this.ui.audioResources.countdown_8_sec;
        this.soundPool[CommonMethods.audioEnterRoom] = [
            [],
            [],
            this.ui.audioResources.enter_room_kongcheng11,
            this.ui.audioResources.enter_room_kongcheng12,
            this.ui.audioResources.game_start
        ];
    };
    GameScene.prototype.saveSettings = function () { };
    // [flag, pass, email]
    GameScene.prototype.savePlayerLoginInfo = function (loginInfo) {
        this.nickNameOverridePass = loginInfo[1];
        this.game.saveConfig('NickNameOverridePass', loginInfo[1]);
        this.game.saveConfig('playerEmail', loginInfo[2]);
    };
    GameScene.prototype.sendMessageToServer = function (messageType, playerID, content) {
        this.websocket.send(JSON.stringify({
            "messageType": messageType, "playerID": playerID, "content": content
        }));
    };
    GameScene.prototype.isInGameHall = function () {
        return this.ui && this.ui.frameGameHall && this.ui.frameGameHall;
    };
    GameScene.prototype.isInGameRoom = function () {
        return this.ui && this.ui.roomOwnerText;
    };
    GameScene.prototype.playAudio = function (audioName, sex) {
        var audioInfo = [];
        if (typeof audioName === "string") {
            if (sex) {
                audioInfo = this.soundPool[audioName][sex];
            }
            else {
                audioInfo = this.soundPool[audioName];
            }
        }
        else if (typeof audioName === "number" && sex) {
            // 杀牌音效
            audioInfo = this.soundPlayersShowCard[audioName][sex];
        }
        if (audioInfo && audioInfo.length >= 2 && this.ui.audioResourceObjects.hasOwnProperty("".concat(audioInfo[0]).concat(audioInfo[1]))) {
            this.ui.audioResourceObjects["".concat(audioInfo[0]).concat(audioInfo[1])].currentTime = 0;
            this.ui.audioResourceObjects["".concat(audioInfo[0]).concat(audioInfo[1])].play();
        }
    };
    GameScene.prototype.stopAudio = function (audioName, sex) {
        var audioInfo = [];
        if (typeof audioName === "string") {
            if (sex) {
                audioInfo = this.soundPool[audioName][sex];
            }
            else {
                audioInfo = this.soundPool[audioName];
            }
        }
        else if (typeof audioName === "number" && sex) {
            // 杀牌音效
            audioInfo = this.soundPlayersShowCard[audioName][sex];
        }
        if (audioInfo && audioInfo.length >= 2 && this.ui.audioResourceObjects.hasOwnProperty("".concat(audioInfo[0]).concat(audioInfo[1]))) {
            this.ui.audioResourceObjects["".concat(audioInfo[0]).concat(audioInfo[1])].currentTime = 0;
            this.ui.audioResourceObjects["".concat(audioInfo[0]).concat(audioInfo[1])].pause();
        }
    };
    return GameScene;
}());
export { GameScene };
