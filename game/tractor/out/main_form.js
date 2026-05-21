import { CurrentPoker } from './current_poker.js';
import { GameState } from './game_state.js';
import { CurrentHandState } from './current_hand_state.js';
import { CurrentTrickState } from './current_trick_state.js';
import { PlayerLocalCache } from './player_local_cache.js';
import { CommonMethods } from './common_methods.js';
import { PlayerEntity } from './player_entity.js';
import { TractorPlayer } from './tractor_player.js';
import { SuitEnums } from './suit_enums.js';
import { DrawingFormHelper } from './drawing_form_helper.js';
import { TractorRules } from './tractor_rules.js';
import { ShowingCardsValidationResult } from './showing_cards_validation_result.js';
import { Algorithm } from './algorithm.js';
import { PokerHelper } from './poker_helper.js';
import { IDBHelper } from './idb_helper.js';
import { FileHelper } from './file_helper.js';
import { OnePlayerAtATime } from './one_player_at_a_time.js';
import { YuezhanEntity } from './yuezhan_entity.js';
var ReadyToStart_REQUEST = "ReadyToStart";
var ToggleIsRobot_REQUEST = "ToggleIsRobot";
var ToggleIsQiangliang_REQUEST = "ToggleIsQiangliang";
var ObserveNext_REQUEST = "ObserveNext";
var ExitRoom_REQUEST = "ExitRoom";
var ExitRoom_REQUEST_TYPE_BootPlayer = "BootPlayer";
var StoreDiscardedCards_REQUEST = "StoreDiscardedCards";
var PlayerShowCards_REQUEST = "PlayerShowCards";
var ValidateDumpingCards_REQUEST = "ValidateDumpingCards";
var CardsReady_REQUEST = "CardsReady";
var ResumeGameFromFile_REQUEST = "ResumeGameFromFile";
var SaveRoomSetting_REQUEST = "SaveRoomSetting";
var SetRankByTeam_REQUEST = "SetRankByTeam";
var SetStarter_REQUEST = "SetStarter";
var RandomSeat_REQUEST = "RandomSeat";
var SwapSeat_REQUEST = "SwapSeat";
var PLAYER_ENTER_ROOM_REQUEST = "PlayerEnterRoom";
var PLAYER_EXIT_AND_ENTER_ROOM_REQUEST = "ExitAndEnterRoom";
var PLAYER_EXIT_AND_OBSERVE_REQUEST = "ExitAndObserve";
var BUY_USE_SKIN_REQUEST = "BuyUseSkin";
var UsedShengbiType_Qiangliangka = "UsedShengbiType_Qiangliangka";
var PLAYER_QIANDAO_REQUEST = "PlayerQiandao";
var MainForm = /** @class */ (function () {
    function MainForm(gs) {
        this.firstWinNormal = 1;
        this.firstWinBySha = 3;
        // public sgcsPlayer: SGCSPlayer;
        this.rightSideButtonDepth = 1;
        this.selectPresetMsgsIsOpen = false;
        this.gameScene = gs;
        this.tractorPlayer = new TractorPlayer(this);
        this.drawingFormHelper = new DrawingFormHelper(this);
        // this.sgDrawingHelper = new SGDrawingHelper(this)
        // this.sgcsPlayer = new SGCSPlayer(this.tractorPlayer.MyOwnId)
        this.PlayerPosition = {};
        this.PositionPlayer = {};
        this.myCardIsReady = Array(33).fill(false);
        this.cardsOrderNumber = 0;
        this.IsDebug = false;
        this.IsQiangliang = false;
        this.SelectedCards = [];
        this.timerIntervalID = [];
        this.isSendEmojiEnabled = true;
        this.DaojuInfo = {};
    }
    MainForm.prototype.HandleRightClickEmptyArea = function () {
        if (this.tractorPlayer.mainForm.gameScene.isReplayMode)
            return;
        if (this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Playing ||
            this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8Cards) {
            this.tractorPlayer.ShowLastTrickCards = !this.tractorPlayer.ShowLastTrickCards;
            if (this.tractorPlayer.ShowLastTrickCards) {
                this.ShowLastTrickAndTumpMade();
            }
            else {
                this.PlayerCurrentTrickShowedCards();
            }
        }
        //一局结束时右键查看最后一轮各家所出的牌，缩小至一半，放在左下角
        else if (this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Ending) {
            this.tractorPlayer.ShowLastTrickCards = !this.tractorPlayer.ShowLastTrickCards;
            if (this.tractorPlayer.ShowLastTrickCards) {
                this.ShowLastTrickAndTumpMade();
            }
            else {
                this.drawingFormHelper.DrawFinishedSendedCards();
            }
        }
        this.gameScene.ui.btnShowLastTrick.innerHTML = (this.tractorPlayer.ShowLastTrickCards ? "还原" : "上轮");
    };
    MainForm.prototype.NewPlayerReadyToStart = function (readyToStart) {
        if (CommonMethods.GetReadyCount(this.tractorPlayer.CurrentGameState.Players) < 4) {
            if (!this.tractorPlayer.isObserver) {
                this.gameScene.ui.btnReady.show();
                this.gameScene.ui.btnReady.classList.remove('disabled');
                this.gameScene.ui.btnReady.classList.add('pointerdiv');
            }
            // small games
            // this.btnSmallGames.setInteractive({ useHandCursor: true })
            // this.btnSmallGames.setColor('white')
        }
        else {
            this.gameScene.ui.btnReady.classList.add('disabled');
            this.gameScene.ui.btnReady.classList.remove('pointerdiv');
            // small games
            // this.btnSmallGames.disableInteractive()
            // this.btnSmallGames.setColor('gray')
            // this.groupSmallGames.setVisible(false);
        }
        this.gameScene.ui.btnReady.innerHTML = (readyToStart ? "取消" : "开始");
        this.setStartLabels();
    };
    MainForm.prototype.PlayerToggleIsRobot = function (isRobot) {
        var _this = this;
        this.gameScene.ui.btnRobot.innerHTML = (isRobot ? "取消" : "托管");
        this.setStartLabels();
        // this.IsDebug 才是实际的托管控制flag
        var changedFromFalseToTrue = isRobot && !this.IsDebug;
        var changedFromTrueToFalse = !isRobot && this.IsDebug;
        this.IsDebug = isRobot;
        var handZone;
        var handZones = document.getElementsByClassName("hand-zone");
        if (handZones.length == 1) {
            handZone = handZones[0];
        }
        var handZoneOverlay;
        var handZoneOverlays = document.getElementsByClassName("hand-zone-overlay");
        if (handZoneOverlays.length == 1) {
            handZoneOverlay = handZoneOverlays[0];
        }
        if (changedFromFalseToTrue) {
            if (handZone) {
                // avoid duplicate overlays
                if (!handZoneOverlay) {
                    // create overlay div
                    var overlay = document.createElement("div");
                    overlay.className = "hand-zone-overlay";
                    // text
                    var text = document.createElement("span");
                    text.innerText = "托管中...";
                    // button
                    var btn = document.createElement("button");
                    btn.innerText = "取消托管";
                    btn.onclick = function () { return _this.btnRobot_Click(); };
                    // append elements
                    overlay.appendChild(text);
                    overlay.appendChild(btn);
                    handZone.appendChild(overlay);
                }
            }
            // 等待玩家切牌
            var btnRandom = document.getElementById("btnRandom");
            if (btnRandom) {
                var cutPoint = 0;
                var cutInfo = "\u53D6\u6D88,".concat(cutPoint);
                this.CutCardShoeCardsCompleteEventHandler(cutPoint, cutInfo);
                return;
            }
            // 其它情况：埋底，领出，跟出
            if (this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8Cards &&
                this.tractorPlayer.CurrentHandState.Last8Holder == this.tractorPlayer.PlayerId)
                this.DiscardingLast8();
            else if (!this.tractorPlayer.CurrentTrickState.IsStarted())
                this.RobotPlayStarting();
            else
                this.RobotPlayFollowing();
        }
        if (changedFromTrueToFalse) {
            if (handZoneOverlay) {
                handZoneOverlay.remove();
            }
        }
    };
    MainForm.prototype.PlayerToggleIsQiangliang = function (isQiangliang) {
        this.gameScene.ui.btnQiangliang.innerHTML = (isQiangliang ? "取消" : "抢亮");
        this.setStartLabels();
        this.IsQiangliang = isQiangliang;
    };
    MainForm.prototype.PlayersTeamMade = function () {
        // 核心修复：重写位置映射逻辑，使其对空位（null）鲁棒
        this.PlayerPosition = {};
        this.PositionPlayer = {};
        var players = this.tractorPlayer.CurrentGameState.Players;
        var myId = this.tractorPlayer.PlayerId;
        var myIdx = CommonMethods.GetPlayerIndexByID(players, myId);
        if (myIdx === -1) myIdx = 0;
        for (var i = 0; i < 4; i++) {
            var curIdx = (myIdx + i) % 4;
            var p = players[curIdx];
            var pos = i + 1; // 1=自己, 2=下家, 3=对家, 4=上家
            if (p != null) {
                this.PlayerPosition[p.PlayerId] = pos;
                this.PositionPlayer[pos] = p.PlayerId;
            } else {
                var emptyId = "[空位 " + (curIdx + 1) + "]";
                this.PlayerPosition[emptyId] = pos;
                this.PositionPlayer[pos] = emptyId;
            }
        }
    };
    MainForm.prototype.NewPlayerJoined = function (shouldReDrawChairOrPlayer, shouldReDrawBtnPauseOrContinueGame) {
        var _this = this;
        if (this.gameScene.isInGameHall()) {
            this.destroyGameHall();
            this.init();
        }
        if (!this.gameScene.ui.frameGameRoom) {
            this.drawGameRoom();
        }
        // this.sgDrawingHelper.myPlayerIndex = CommonMethods.GetPlayerIndexByID(this.tractorPlayer.CurrentGameState.Players, this.tractorPlayer.MyOwnId);
        // this.sgcsPlayer.PlayerIndex = this.sgDrawingHelper.myPlayerIndex;
        // this.roomNameText.setVisible(true)
        // this.roomOwnerText.setVisible(true)
        // this.btnExitRoom.setVisible(true)
        this.gameScene.ui.btnShowLastTrick.show();
        if (this.tractorPlayer.isObserver) {
            this.gameScene.ui.btnReady.hide();
            this.gameScene.ui.btnReady.classList.remove('pointerdiv');
            this.gameScene.ui.btnRobot.hide();
            this.gameScene.ui.btnQiangliang.hide();
            if (this.gameScene.ui.btnExitAndObserve) {
                this.gameScene.ui.btnExitAndObserve.remove();
                delete this.gameScene.ui.btnExitAndObserve;
            }
        }
        else {
            this.gameScene.ui.btnReady.show();
            this.gameScene.ui.btnReady.classList.add('pointerdiv');
            this.gameScene.ui.btnRobot.show();
            this.gameScene.ui.btnQiangliang.show();
            if (!this.gameScene.ui.btnExitAndObserve) {
                this.gameScene.ui.btnExitAndObserve = this.gameScene.ui.create.system('上树', function () { return _this.ExitAndObserve(); }, true, true);
            }
        }
        // btnPauseOrContinueGame
        if (shouldReDrawBtnPauseOrContinueGame) {
            if (this.tractorPlayer.CurrentRoomSetting.RoomOwner === this.tractorPlayer.MyOwnId) {
                var btnName_1 = this.tractorPlayer.CurrentRoomSetting.IsPaused ? "继续" : "暂停";
                var isPlaying = (this.tractorPlayer.CurrentHandState.CurrentHandStep === SuitEnums.HandStep.Playing);
                if (!this.gameScene.ui.btnPauseOrContinueGame) {
                    this.gameScene.ui.btnPauseOrContinueGame = this.gameScene.ui.create.system(btnName_1, function () { return _this.PauseOrContinueGame(); }, true, true);
                    // 核心修复：新生成的按钮立即应用暗黑样式
                    if (!isPlaying) {
                        this.gameScene.ui.btnPauseOrContinueGame.style.opacity = "0.5";
                        this.gameScene.ui.btnPauseOrContinueGame.style.filter = "grayscale(1)";
                    }
                }
                else {
                    this.gameScene.ui.btnPauseOrContinueGame.hide();
                    setTimeout(function () {
                        if (_this.gameScene.ui.btnPauseOrContinueGame) {
                            _this.gameScene.ui.btnPauseOrContinueGame.show();
                            _this.gameScene.ui.btnPauseOrContinueGame.innerHTML = btnName_1;
                            // 核心修复：延迟后再次同步样式
                            var currentStep = _this.tractorPlayer.CurrentHandState.CurrentHandStep;
                            if (currentStep !== SuitEnums.HandStep.Playing) {
                                _this.gameScene.ui.btnPauseOrContinueGame.classList.add('disabled');
                                _this.gameScene.ui.btnPauseOrContinueGame.classList.remove('pointerdiv');
                                _this.gameScene.ui.btnPauseOrContinueGame.style.opacity = "0.5";
                                _this.gameScene.ui.btnPauseOrContinueGame.style.filter = "grayscale(1)";
                            }
                        }
                    }, 3000);
                }
                // 核心修复：初始同步
                if (!isPlaying && this.gameScene.ui.btnPauseOrContinueGame) {
                    this.gameScene.ui.btnPauseOrContinueGame.classList.add('disabled');
                    this.gameScene.ui.btnPauseOrContinueGame.classList.remove('pointerdiv');
                    this.gameScene.ui.btnPauseOrContinueGame.style.opacity = "0.5";
                    this.gameScene.ui.btnPauseOrContinueGame.style.filter = "grayscale(1)";
                }
            }
            else {
                if (this.gameScene.ui.btnPauseOrContinueGame) {
                    this.gameScene.ui.btnPauseOrContinueGame.remove();
                    delete this.gameScene.ui.btnPauseOrContinueGame;
                }
            }
        }
        this.UpdateRobotButtonStatus();
        // // small games
        // this.btnSmallGames.setVisible(!this.tractorPlayer.isObserver);
        // if (this.tractorPlayer.isObserver) {
        //     this.groupSmallGames.setVisible(false);
        // }
        if (shouldReDrawChairOrPlayer)
            this.destroyImagesChairOrPlayer();
        this.destroyPokerPlayerObGameRoom();
        var curIndex = CommonMethods.GetPlayerIndexByID(this.tractorPlayer.CurrentGameState.Players, this.tractorPlayer.PlayerId);
        if (curIndex === -1) curIndex = 0; // 核心加固

        var _loop_1 = function (i) {
            var p = this_1.tractorPlayer.CurrentGameState.Players[curIndex];
            // 核心修复：如果 ID 包含 [空位，说明是没人但有观察者的席位，也画成椅子
            var isEmptySeat = !p || (p.PlayerId && p.PlayerId.indexOf("[空位") !== -1);
            if (isEmptySeat) {
                if (shouldReDrawChairOrPlayer) {
                    if (i === 0) {
                        this_1.gameScene.ui.gameMe.hide(); // 核心修复：如果是空位，隐藏自己的主视角头像框
                    }
                    pokerChair = this_1.gameScene.ui.create.div('.pokerChair', this_1.gameScene.ui.frameGameRoom);
                    pokerChair.setBackgroundImage('image/tractor/btn/poker_chair.png');
                    if (i === 1)
                        pokerChair.style.right = "calc(".concat(this_1.gameScene.coordinates.playerChairPositions[i].x, ")");
                    else
                        pokerChair.style.left = "calc(".concat(this_1.gameScene.coordinates.playerChairPositions[i].x, ")");
                    if (i === 2)
                        pokerChair.style.top = "calc(".concat(this_1.gameScene.coordinates.playerChairPositions[i].y, ")");
                    else
                        pokerChair.style.bottom = "calc(".concat(this_1.gameScene.coordinates.playerChairPositions[i].y, ")");
                    pokerChair.style.width = '80px';
                    pokerChair.style.height = '80px';
                    pokerChair.style['background-size'] = '100% 100%';
                    pokerChair.style['background-repeat'] = 'no-repeat';
                    pokerChair.style.cursor = 'pointer';
                    pokerChair.setAttribute('data-position', i);
                    // click
                    pokerChair.addEventListener("click", function (e) {
                        // 核心加固：点击椅子时，如果是观察者，传绝对索引 i，如果是玩家传 playerIndex
                        if (_this.tractorPlayer.isObserver) {
                            _this.ExitRoomAndEnter(i);
                        } else {
                            var pos = i + 1;
                            var playerIndex = CommonMethods.GetPlayerIndexByPos(_this.tractorPlayer.CurrentGameState.Players, _this.tractorPlayer.PlayerId, pos);
                            _this.ExitRoomAndEnter(playerIndex);
                        }
                    });
                    // mouseover
                    pokerChair.addEventListener("mouseover", function (e) {
                        var pos = parseInt(e.target.getAttribute('data-position'));
                        if (pos === 2)
                            e.target.style.top = "calc(".concat(_this.gameScene.coordinates.playerChairPositions[i].y, " - 5px)");
                        else
                            e.target.style.bottom = "calc(".concat(_this.gameScene.coordinates.playerChairPositions[i].y, " + 5px)");
                    });
                    // mouseout
                    pokerChair.addEventListener("mouseout", function (e) {
                        var pos = parseInt(e.target.getAttribute('data-position'));
                        if (pos === 2)
                            e.target.style.top = "calc(".concat(_this.gameScene.coordinates.playerChairPositions[i].y, ")");
                        else
                            e.target.style.bottom = "calc(".concat(_this.gameScene.coordinates.playerChairPositions[i].y, ")");
                    });
                    this_1.gameScene.ui.gameRoomImagesChairOrPlayer[i] = pokerChair;
                }
                // 即使是椅子，如果有观察者数据也要画出来
                if (p) {
                    this_1.SetObText(p, i, this_1.gameScene, 80);
                }
            }
            else {
                if (shouldReDrawChairOrPlayer) {
                    //skin                
                    var skinInUse = this_1.DaojuInfo.daojuInfoByPlayer[p.PlayerId] ? this_1.DaojuInfo.daojuInfoByPlayer[p.PlayerId].skinInUse : CommonMethods.defaultSkinInUse;
                    if (i !== 0) {
                        var playerUI = this_1.CreatePlayer(i, p.PlayerId, this_1.gameScene.ui.frameGameRoom);
                        this_1.gameScene.ui.gameRoomImagesChairOrPlayer[i] = playerUI;
                        var skinType = this_1.GetSkinType(skinInUse);
                        var skinURL = "";
                        if (skinInUse.startsWith("URL:")) {
                            skinURL = skinInUse;
                        } else {
                            var skinExtention = skinType === 0 ? "webp" : "gif";
                            skinURL = "image/tractor/skin/".concat(skinInUse, ".").concat(skinExtention);
                        }
                        this_1.SetAvatarImage(false, this_1.gameScene, i, skinType, skinURL, playerUI, this_1.gameScene.coordinates.cardHeight, this_1.SetObText, p);
                    }
                    else {
                        this_1.gameScene.ui.gameMe.show(); // 核心修复：如果是坐着的玩家，确保显示头像框
                        this_1.gameScene.ui.gameMe.node.nameol.innerHTML = this_1.gameScene.hidePlayerID ? "" : this_1.tractorPlayer.PlayerId;
                        var skinInUseMe = this_1.tractorPlayer.isObserver ? skinInUse : this_1.gameScene.skinInUse;
                        var skinTypeMe = this_1.GetSkinType(skinInUseMe);
                        var skinURLMe = "";
                        if (skinInUseMe.startsWith("URL:")) {
                            skinURLMe = skinInUseMe;
                        } else {
                            var skinExtentionMe = skinTypeMe === 0 ? "webp" : "gif";
                            skinURLMe = "image/tractor/skin/".concat(skinInUseMe, ".").concat(skinExtentionMe);
                        }
                        this_1.SetAvatarImage(false, this_1.gameScene, i, skinTypeMe, skinURLMe, this_1.gameScene.ui.gameMe, this_1.gameScene.coordinates.cardHeight, this_1.SetObText, p);
                    }
                    // 旁观玩家切换视角/房主将玩家请出房间
                    if ((this_1.tractorPlayer.isObserver || this_1.tractorPlayer.CurrentRoomSetting.RoomOwner === this_1.tractorPlayer.MyOwnId) && i !== 0) {
                        var curPlayerImage = this_1.gameScene.ui.gameRoomImagesChairOrPlayer[i];
                        curPlayerImage.style.cursor = 'pointer';
                        // click
                        curPlayerImage.addEventListener("click", function (e) {
                            var pos = i + 1;
                            if (_this.tractorPlayer.isObserver) {
                                _this.destroyImagesChairOrPlayer();
                                _this.observeByPosition(pos);
                            }
                            else if (_this.tractorPlayer.CurrentRoomSetting.RoomOwner === _this.tractorPlayer.MyOwnId) {
                                var c = window.confirm("是否确定将此玩家请出房间？");
                                if (c == true) {
                                    _this.bootPlayerByPosition(pos);
                                }
                            }
                        });
                        // mouseover
                        curPlayerImage.addEventListener("mouseover", function (e) {
                            var targetUI = jQuery(e.target).closest('.player')[0];
                            var pos = parseInt(targetUI.getAttribute('data-position'));
                            if (pos === 2)
                                targetUI.style.top = "calc(".concat(_this.gameScene.coordinates.playerSkinPositions[i].y, " - 5px)");
                            else
                                targetUI.style.bottom = "calc(".concat(_this.gameScene.coordinates.playerSkinPositions[i].y, " + 5px)");
                        });
                        // mouseout
                        curPlayerImage.addEventListener("mouseout", function (e) {
                            var targetUI = jQuery(e.target).closest('.player')[0];
                            var pos = parseInt(targetUI.getAttribute('data-position'));
                            if (pos === 2)
                                targetUI.style.top = "calc(".concat(_this.gameScene.coordinates.playerSkinPositions[i].y, ")");
                            else
                                targetUI.style.bottom = "calc(".concat(_this.gameScene.coordinates.playerSkinPositions[i].y, ")");
                        });
                    }
                }
                else {
                    var playerUI = i === 0 ? this_1.gameScene.ui.gameMe : this_1.gameScene.ui.gameRoomImagesChairOrPlayer[i];
                    this_1.SetObText(p, i, this_1.gameScene, playerUI.clientWidth);
                }
            }
            curIndex = (curIndex + 1) % 4;
        };
        var this_1 = this, pokerChair;
        for (var i = 0; i < 4; i++) {
            _loop_1(i);
        }
    };
    MainForm.prototype.SetObText = function (p, i, gs, skinWid) {
        if (gs.hidePlayerID || !p) // 核心修复：增加 p 存在性检查，防止异步刷新导致的崩溃
            return;
        if (p.Observers && p.Observers.length > 0) {
            var obNameText = "";
            var tempWidOb = 0;
            for (var j = 0; j < p.Observers.length; j++) {
                var ob = p.Observers[j];
                if (i === 1) {
                    var tempLenOb = ob.length + 2;
                    var tempLenDeltaOb = (ob.match(gs.coordinates.regexNonEnglishChar) || []).length;
                    var newWid = gs.coordinates.player1TextWid * tempLenOb + gs.coordinates.player1TextWidBigDelta * tempLenDeltaOb;
                    tempWidOb = Math.max(tempWidOb, newWid);
                }
                var newLine = j === 0 || obNameText.length === 0 ? "" : "<br/>";
                obNameText += "".concat(newLine, "\u3010").concat(ob, "\u3011");
            }
            var pokerPlayerOb = gs.ui.create.div('.pokerPlayerObGameRoom', obNameText, gs.ui.frameGameRoom);
            pokerPlayerOb.style.fontFamily = 'serif';
            pokerPlayerOb.style.fontSize = '16px';
            pokerPlayerOb.style.textAlign = 'left';
            if (gs.ui.pokerPlayerObGameRoom[i])
                gs.ui.pokerPlayerObGameRoom[i].remove();
            gs.ui.pokerPlayerObGameRoom[i] = pokerPlayerOb;
            var obX = gs.coordinates.observerTextPositions[i].x;
            var obY = gs.coordinates.observerTextPositions[i].y;
            switch (i) {
                case 0:
                    obX = "calc(".concat(obX, " + ").concat(skinWid, "px)");
                    pokerPlayerOb.style.left = "calc(".concat(obX, ")");
                    pokerPlayerOb.style.bottom = "calc(".concat(obY, ")");
                    break;
                case 1:
                    pokerPlayerOb.style.right = "calc(".concat(obX, ")");
                    pokerPlayerOb.style.top = "calc(".concat(obY, ")");
                    pokerPlayerOb.style.width = tempWidOb;
                    pokerPlayerOb.style.textAlign = 'right';
                    break;
                case 2:
                    obX = "calc(".concat(obX, " + ").concat(skinWid, "px)");
                    pokerPlayerOb.style.left = "calc(".concat(obX, ")");
                    pokerPlayerOb.style.top = "calc(".concat(obY, ")");
                    break;
                case 3:
                    pokerPlayerOb.style.left = "calc(".concat(obX, ")");
                    pokerPlayerOb.style.top = "calc(".concat(obY, ")");
                    break;
                default:
                    break;
            }
        }
    };
    MainForm.prototype.ExitRoomAndEnter = function (posID) {
        this.destroyGameRoom();
        this.gameScene.sendMessageToServer(PLAYER_EXIT_AND_ENTER_ROOM_REQUEST, this.tractorPlayer.MyOwnId, JSON.stringify({
            roomID: -1,
            posID: posID,
        }));
    };
    MainForm.prototype.ExitAndObserve = function () {
        var step = this.tractorPlayer.CurrentHandState.CurrentHandStep;
        var isIdle = (step === SuitEnums.HandStep.BeforeDistributingCards || step === SuitEnums.HandStep.Ending);
        
        if (!isIdle) {
            alert("游戏中途不允许上树,请完成此盘游戏后重试");
            return;
        }

        if (this.tractorPlayer.isObserver) return;

        // 核心优化：不再在前端拦截唯一真人的上树请求。
        // 后端 forceLeave 会自动处理房主权移交或悬空。
        console.log("[Observe] 点击上树, 当前状态:", { step: step, isIdle: isIdle });
        this.destroyGameRoom();
        this.gameScene.sendMessageToServer(PLAYER_EXIT_AND_OBSERVE_REQUEST, this.tractorPlayer.MyOwnId, "");
    };
    MainForm.prototype.PauseOrContinueGame = function () {
        if (!this.gameScene.ui.btnPauseOrContinueGame || this.gameScene.ui.btnPauseOrContinueGame.classList.contains('hidden') || this.gameScene.ui.btnPauseOrContinueGame.classList.contains('disabled'))
            return;
        this.gameScene.ui.btnPauseOrContinueGame.hide();
        
        // 核心修复：显式切换 IsPaused 状态，并同步倒计时秒数
        this.tractorPlayer.CurrentRoomSetting.IsPaused = !this.tractorPlayer.CurrentRoomSetting.IsPaused;
        
        var newVal = this.tractorPlayer.CurrentRoomSetting.secondsToShowCards;
        if (this.tractorPlayer.CurrentRoomSetting.IsPaused) {
            // 暂停：记录当前秒数，然后设为 0（触发后端计时器清理）
            this.tractorPlayer.CurrentRoomSetting.secondsToShowCardsPrev = this.tractorPlayer.CurrentRoomSetting.secondsToShowCards;
            newVal = 0;
        }
        else {
            // 继续：恢复之前的秒数
            if (this.tractorPlayer.CurrentRoomSetting.secondsToShowCardsPrev == 0) {
                this.tractorPlayer.CurrentRoomSetting.secondsToShowCardsPrev = 30;
            }
            newVal = this.tractorPlayer.CurrentRoomSetting.secondsToShowCardsPrev;
        }
        
        this.tractorPlayer.CurrentRoomSetting.secondsToShowCards = newVal;
        this.gameScene.sendMessageToServer(SaveRoomSetting_REQUEST, this.tractorPlayer.MyOwnId, JSON.stringify(this.tractorPlayer.CurrentRoomSetting));
    };
    //     public SmallGamesHandler() {
    //         this.groupSmallGames.toggleVisible();
    //     }
    MainForm.prototype.ReenterOrResumeOrObservePlayerByIDEvent = function (drawCards) {
        this.drawingFormHelper.DrawSidebarFull();
        if (!drawCards)
            return;
        this.tractorPlayer.playerLocalCache.ShowedCardsInCurrentTrick = CommonMethods.deepCopy(this.tractorPlayer.CurrentTrickState.ShowedCards);
        if (this.tractorPlayer.CurrentTrickState.ShowedCards && this.tractorPlayer.CurrentTrickState.ShowedCards.length == 4) {
            this.tractorPlayer.playerLocalCache.WinnderID = TractorRules.GetWinner(this.tractorPlayer.CurrentTrickState);
            this.tractorPlayer.playerLocalCache.WinResult = this.IsWinningWithTrump(this.tractorPlayer.CurrentTrickState, this.tractorPlayer.playerLocalCache.WinnderID);
        }
        this.PlayerCurrentTrickShowedCards();
        this.drawingFormHelper.ResortMyHandCards(true);
        this.DrawDiscardedCardsCaller();
    };
    MainForm.prototype.TrumpChanged = function () {
        this.drawingFormHelper.DrawSidebarFull();
        if (SuitEnums.HandStep.DistributingCards <= this.tractorPlayer.CurrentHandState.CurrentHandStep &&
            this.tractorPlayer.CurrentHandState.CurrentHandStep < SuitEnums.HandStep.DistributingLast8Cards) {
            this.gameScene.playAudio(CommonMethods.audioLiangpai, this.GetPlayerSex(this.tractorPlayer.CurrentHandState.TrumpMaker));
            this.drawingFormHelper.TrumpMadeCardsShow();
        }
        this.drawingFormHelper.reDrawToolbar();
    };
    MainForm.prototype.TrumpChangedForObservePlayerById = function () {
        if (SuitEnums.HandStep.DistributingCards <= this.tractorPlayer.CurrentHandState.CurrentHandStep &&
            this.tractorPlayer.CurrentHandState.CurrentHandStep < SuitEnums.HandStep.DistributingLast8Cards) {
            this.drawingFormHelper.TrumpMadeCardsShow();
            this.drawingFormHelper.reDrawToolbar();
        }
    };
    MainForm.prototype.destroyGameRoom = function () {
        this.StartGame();
        this.drawingFormHelper.destroySidebar();
        if (this.gameScene.ui.handZone) {
            this.gameScene.ui.handZone.remove();
            delete this.gameScene.ui.handZone;
        }
        if (this.gameScene.ui.gameMe) {
            this.gameScene.ui.gameMe.remove();
            delete this.gameScene.ui.gameMe;
        }
        delete this.gameScene.ui.roomNameText;
        delete this.gameScene.ui.roomOwnerText;
        if (this.gameScene.ui.btnPig) {
            this.gameScene.ui.btnPig.remove();
            delete this.gameScene.ui.btnPig;
        }
        this.gameScene.ui.gameRoomImagesChairOrPlayer = [];
        this.gameScene.ui.pokerPlayerObGameRoom = [];
        this.gameScene.ui.pokerPlayerStartersLabel = [];
        if (this.gameScene.ui.btnRobot) {
            this.gameScene.ui.btnRobot.remove();
            delete this.gameScene.ui.btnRobot;
        }
        if (this.gameScene.ui.btnReady) {
            this.gameScene.ui.btnReady.remove();
            delete this.gameScene.ui.btnReady;
        }
        if (this.gameScene.ui.btnQiangliang) {
            this.gameScene.ui.btnQiangliang.remove();
            delete this.gameScene.ui.btnQiangliang;
        }
        if (this.gameScene.ui.btnShowLastTrick) {
            this.gameScene.ui.btnShowLastTrick.remove();
            delete this.gameScene.ui.btnShowLastTrick;
        }
        if (this.gameScene.ui.btnExitAndObserve) {
            this.gameScene.ui.btnExitAndObserve.remove();
            delete this.gameScene.ui.btnExitAndObserve;
        }
        if (this.gameScene.ui.btnPauseOrContinueGame) {
            this.gameScene.ui.btnPauseOrContinueGame.remove();
            delete this.gameScene.ui.btnPauseOrContinueGame;
        }
        if (this.gameScene.ui.frameGameRoom) {
            this.gameScene.ui.frameGameRoom.remove();
            delete this.gameScene.ui.frameGameRoom;
        }
        this.tractorPlayer.PlayerId = this.tractorPlayer.MyOwnId;
        this.tractorPlayer.isObserver = false;
        if (this.gameScene.ui.gameMe) {
            this.gameScene.ui.gameMe.node.nameol.innerHTML = this.gameScene.hidePlayerID ? "" : this.tractorPlayer.MyOwnId;
            var skinTypeMe = this.GetSkinType(this.gameScene.skinInUse);
            var skinExtentionMe = skinTypeMe === 0 ? "webp" : "gif";
            var skinURL = "image/tractor/skin/".concat(this.gameScene.skinInUse, ".").concat(skinExtentionMe);
            this.SetAvatarImage(false, this.gameScene, 0, skinTypeMe, skinURL, this.gameScene.ui.gameMe, this.gameScene.coordinates.cardHeight);
        }
        this.PlayerPosition = {};
        this.PositionPlayer = {};
        //重置状态
        this.tractorPlayer.CurrentGameState = new GameState();
        this.tractorPlayer.CurrentHandState = new CurrentHandState(this.tractorPlayer.CurrentGameState);
    };
    MainForm.prototype.destroyImagesChairOrPlayer = function () {
        if (this.gameScene.ui.gameRoomImagesChairOrPlayer) {
            this.gameScene.ui.gameRoomImagesChairOrPlayer.forEach(function (image) {
                if (image)
                    image.remove();
            });
            this.gameScene.ui.gameRoomImagesChairOrPlayer = [];
        }
    };
    MainForm.prototype.destroyPokerPlayerStartersLabel = function () {
        if (this.gameScene.ui.pokerPlayerStartersLabel) {
            this.gameScene.ui.pokerPlayerStartersLabel.forEach(function (image) {
                if (image)
                    image.remove();
            });
            this.gameScene.ui.pokerPlayerStartersLabel = [];
        }
    };
    MainForm.prototype.destroyPokerPlayerObGameRoom = function () {
        if (!this.gameScene.ui.pokerPlayerObGameRoom) {
            this.gameScene.ui.pokerPlayerObGameRoom = [];
        }
        this.gameScene.ui.pokerPlayerObGameRoom.forEach(function (image) {
            if (image)
                image.remove();
        });
        this.gameScene.ui.pokerPlayerObGameRoom = [];
    };
    MainForm.prototype.PlayerOnGetCard = function (cardNumber) {
        //发牌播放提示音
        if (this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DistributingCards) {
            this.gameScene.playAudio(CommonMethods.audioDraw);
        }
        this.drawingFormHelper.IGetCard(cardNumber);
        //托管代打：亮牌
        var shengbi = 0;
        if (this.DaojuInfo && this.DaojuInfo.daojuInfoByPlayer && this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId]) {
            shengbi = parseInt(this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId].Shengbi);
        }
        var isUsingQiangliangka = shengbi >= CommonMethods.qiangliangkaCost || this.tractorPlayer.CurrentHandState.TrumpMaker && this.tractorPlayer.CurrentHandState.TrumpMaker === this.tractorPlayer.MyOwnId;
        if (this.IsQiangliang &&
            (this.tractorPlayer.CurrentRoomSetting.IsFullDebug ||
                this.tractorPlayer.CurrentRoomSetting.AllowRobotMakeTrump ||
                isUsingQiangliangka) &&
            !this.tractorPlayer.isObserver) {
            var availableTrump = this.tractorPlayer.AvailableTrumps();
            var qiangliangMin = parseInt(this.gameScene.qiangliangMin);
            var trumpToExpose = Algorithm.TryExposingTrump(availableTrump, qiangliangMin, this.tractorPlayer.CurrentHandState.IsFirstHand, this.tractorPlayer.CurrentPoker, this.tractorPlayer.CurrentRoomSetting.IsFullDebug);
            if (trumpToExpose == SuitEnums.Suit.None)
                return;
            var next = this.tractorPlayer.CurrentHandState.TrumpExposingPoker + 1;
            if (trumpToExpose == SuitEnums.Suit.Joker) {
                if (this.tractorPlayer.CurrentPoker.BlackJoker() == 2)
                    next = SuitEnums.TrumpExposingPoker.PairBlackJoker;
                else if (this.tractorPlayer.CurrentPoker.RedJoker() == 2)
                    next = SuitEnums.TrumpExposingPoker.PairRedJoker;
            }
            // 之前自己抢亮，后来再双亮加持不消耗抢亮卡
            var usedShengbi = 0;
            if (next === SuitEnums.TrumpExposingPoker.SingleRank || this.tractorPlayer.CurrentHandState.TrumpMaker !== this.tractorPlayer.MyOwnId) {
                usedShengbi = 1;
            }
            this.tractorPlayer.ExposeTrump(next, trumpToExpose, usedShengbi);
        }
    };
    MainForm.prototype.ShowingCardBegan = function () {
        this.drawingFormHelper.destroyToolbar();
        this.drawingFormHelper.destroyAllShowedCards();
        this.tractorPlayer.destroyAllClientMessages();
        this.drawingFormHelper.DrawScoreImageAndCards();
        //出牌开始前，去掉不需要的controls
        // this.btnSurrender.Visible = false;
        // this.btnRiot.Visible = false;
    };
    MainForm.prototype.DistributingLast8Cards = function () {
        this.tractorPlayer.destroyAllClientMessages();
        //先去掉反牌按钮，再放发底牌动画
        this.drawingFormHelper.destroyToolbar();
        //重画手牌，从而把被提升的自己亮的牌放回去
        this.drawingFormHelper.ResortMyHandCards();
        var position = this.PlayerPosition[this.tractorPlayer.CurrentHandState.Last8Holder];
        //自己摸底不用画
        if (position > 1) {
            this.drawingFormHelper.DrawDistributingLast8Cards(position);
        }
        else {
            //播放摸底音效
            this.gameScene.playAudio(CommonMethods.audioDrawx);
        }
        if (this.tractorPlayer.isObserver) {
            return;
        }
        //摸牌结束，如果允许投降，则显示投降按钮
        if (this.tractorPlayer.CurrentRoomSetting.AllowSurrender) {
            // this.btnSurrender.Visible = true;
        }
        //仅允许台下的玩家可以革命
        // if (!this.ThisPlayer.CurrentGameState.ArePlayersInSameTeam(this.ThisPlayer.CurrentHandState.Starter, this.ThisPlayer.PlayerId))
        // {
        //     //摸牌结束，如果允许分数革命，则判断是否该显示革命按钮
        //     int riotScoreCap = ThisPlayer.CurrentRoomSetting.AllowRiotWithTooFewScoreCards;
        //     if (ThisPlayer.CurrentPoker.GetTotalScore() <= riotScoreCap)
        //     {
        //         this.btnRiot.Visible = true;
        //     }
        //     //摸牌结束，如果允许主牌革命，则判断是否该显示革命按钮
        //     int riotTrumpCap = ThisPlayer.CurrentRoomSetting.AllowRiotWithTooFewTrumpCards;
        //     if (ThisPlayer.CurrentPoker.GetMasterCardsCount() <= riotTrumpCap && ThisPlayer.CurrentHandState.Trump != Suit.Joker)
        //     {
        //         this.btnRiot.Visible = true;
        //     }
        // }
    };
    MainForm.prototype.ResetBtnRobot = function () {
        // 核心修复：移除发牌结束后对托管(isRobot)的自动取消，改为仅处理“抢亮”状态的重置
        if (this.tractorPlayer.isObserver)
            return;
        var me = CommonMethods.GetPlayerByID(this.tractorPlayer.CurrentGameState.Players, this.tractorPlayer.MyOwnId);
        
        // if (me.IsRobot && this.gameScene.ui.btnRobot && this.gameScene.ui.btnRobot.innerHTML === "取消" && !this.tractorPlayer.CurrentRoomSetting.IsFullDebug) {
        //     this.btnRobot_Click();
        // }

        if (me.IsQiangliang && this.gameScene.ui.btnQiangliang && this.gameScene.ui.btnQiangliang.innerHTML === "取消" && !this.tractorPlayer.CurrentRoomSetting.IsFullDebug) {
            this.btnQiangliang_Click();
        }
    };
    MainForm.prototype.StartGame = function () {
        this.tractorPlayer.CurrentPoker = new CurrentPoker();
        this.tractorPlayer.CurrentPoker.Rank = this.tractorPlayer.CurrentHandState.Rank;
        //游戏开始前重置各种变量
        this.tractorPlayer.ShowLastTrickCards = false;
        this.tractorPlayer.playerLocalCache = new PlayerLocalCache();
        // this.btnSurrender.Visible = false;
        // this.btnRiot.Visible = false;
        this.tractorPlayer.CurrentTrickState.serverLocalCache.lastShowedCards = [];
        this.gameScene.game.timerCurrent = 0;
        if (this.gameScene.ui.btnPig) {
            this.gameScene.ui.btnPig.hide();
            this.gameScene.ui.btnPig.classList.add('disabled');
            this.gameScene.ui.btnPig.classList.remove('pointerdiv');
        }
        this.init();
    };
    MainForm.prototype.DiscardingLast8 = function () {
        // Graphics g = Graphics.FromImage(bmp);
        // g.DrawImage(image, 200 + drawingFormHelper.offsetCenterHalf, 186 + drawingFormHelper.offsetCenterHalf, 85 * drawingFormHelper.scaleDividend, 96 * drawingFormHelper.scaleDividend);
        // Refresh();
        // g.Dispose();
        //托管代打：埋底
        if (this.IsDebug && !this.tractorPlayer.isObserver) {
            if (this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8Cards &&
                this.tractorPlayer.CurrentHandState.Last8Holder == this.tractorPlayer.PlayerId) //如果等我扣牌
             {
                this.SelectedCards = [];
                Algorithm.ShouldSelectedLast8Cards(this.SelectedCards, this.tractorPlayer.CurrentPoker);
                if (this.SelectedCards.length == 8) {
                    this.ToDiscard8Cards();
                }
                else {
                    alert("failed to auto select last 8 cards: ".concat(this.SelectedCards, ", please manually select"));
                }
            }
        }
    };
    MainForm.prototype.Last8Discarded = function () {
        this.gameScene.playAudio(CommonMethods.audioTie);
        if (this.tractorPlayer.isObserver && this.tractorPlayer.CurrentHandState.Last8Holder == this.tractorPlayer.PlayerId) {
            var tempCP = this.tractorPlayer.CurrentHandState.PlayerHoldingCards[this.tractorPlayer.PlayerId];
            this.tractorPlayer.CurrentPoker.CloneFrom(tempCP);
            this.drawingFormHelper.removeCardImage(this.tractorPlayer.CurrentHandState.DiscardedCards);
            this.drawingFormHelper.ResortMyHandCards();
        }
        this.DrawDiscardedCardsCaller(true);
    };
    MainForm.prototype.DrawDiscardedCardsCaller = function (doAni) {
        if (this.tractorPlayer.CurrentPoker != null && this.tractorPlayer.CurrentPoker.Count() > 0 &&
            this.tractorPlayer.CurrentHandState.DiscardedCards != null &&
            this.tractorPlayer.CurrentHandState.DiscardedCards.length == 8) {
            this.drawingFormHelper.DrawDiscardedCards(doAni);
        }
    };
    MainForm.prototype.HandEnding = function () {
        this.drawingFormHelper.DrawFinishedSendedCards();
    };
    MainForm.prototype.StarterChangedEvent = function () {
        this.setStartLabels();
    };
    MainForm.prototype.StarterFailedForTrump = function () {
        this.drawingFormHelper.DrawSidebarFull();
        this.drawingFormHelper.ResortMyHandCards();
        this.drawingFormHelper.reDrawToolbar();
    };
    //检查当前出牌者的牌是否为大牌：0 - 否；1 - 是；2 - 是且为吊主；3 - 是且为主毙牌
    MainForm.prototype.IsWinningWithTrump = function (trickState, playerID) {
        var isLeaderTrump = PokerHelper.IsTrump(trickState.LeadingCards()[0], this.tractorPlayer.CurrentHandState.Trump, this.tractorPlayer.CurrentHandState.Rank);
        if (playerID == trickState.Learder) {
            if (isLeaderTrump)
                return 2;
            else
                return 1;
        }
        var winnerID = TractorRules.GetWinner(trickState);
        if (playerID == winnerID) {
            var isWinnerTrump = PokerHelper.IsTrump(CommonMethods.GetShowedCardsByPlayerID(trickState.ShowedCards, winnerID)[0], this.tractorPlayer.CurrentHandState.Trump, this.tractorPlayer.CurrentHandState.Rank);
            if (!isLeaderTrump && isWinnerTrump)
                return 3;
            return 1;
        }
        return 0;
    };
    MainForm.prototype.PlayerShowedCards = function () {
        if (!this.tractorPlayer.CurrentHandState.PlayerHoldingCards[this.tractorPlayer.CurrentTrickState.Learder])
            return;
        //如果新的一轮开始，重置缓存信息
        if (this.tractorPlayer.CurrentTrickState.CountOfPlayerShowedCards() == 1) {
            this.tractorPlayer.playerLocalCache = new PlayerLocalCache();
        }
        var curPoker = new CurrentPoker();
        curPoker.CloneFrom(this.tractorPlayer.CurrentHandState.PlayerHoldingCards[this.tractorPlayer.CurrentTrickState.Learder]);
        if (curPoker.Count() == 0) {
            this.tractorPlayer.playerLocalCache.isLastTrick = true;
        }
        var latestPlayer = this.tractorPlayer.CurrentTrickState.LatestPlayerShowedCard();
        this.tractorPlayer.playerLocalCache.ShowedCardsInCurrentTrick = CommonMethods.deepCopy(this.tractorPlayer.CurrentTrickState.ShowedCards);
        var winResult = this.IsWinningWithTrump(this.tractorPlayer.CurrentTrickState, latestPlayer);
        var position = this.PlayerPosition[latestPlayer];
        var showedCards = CommonMethods.GetShowedCardsByPlayerID(this.tractorPlayer.CurrentTrickState.ShowedCards, latestPlayer);
        //如果大牌变更，更新缓存相关信息
        if (winResult >= this.firstWinNormal) {
            if (winResult < this.firstWinBySha || this.tractorPlayer.playerLocalCache.WinResult < this.firstWinBySha) {
                this.tractorPlayer.playerLocalCache.WinResult = winResult;
            }
            else {
                this.tractorPlayer.playerLocalCache.WinResult++;
            }
            this.tractorPlayer.playerLocalCache.WinnerPosition = position;
            this.tractorPlayer.playerLocalCache.WinnderID = latestPlayer;
        }
        //如果不在回看上轮出牌，才重画刚刚出的牌
        if (!this.tractorPlayer.ShowLastTrickCards) {
            //擦掉上一把
            if (this.tractorPlayer.CurrentTrickState.CountOfPlayerShowedCards() == 1) {
                this.tractorPlayer.destroyAllClientMessages();
                this.drawingFormHelper.destroyAllShowedCards();
                this.drawingFormHelper.DrawScoreImageAndCards();
            }
            //播放出牌音效
            if (this.tractorPlayer.CurrentRoomSetting.HideOverridingFlag) {
                this.gameScene.playAudio(0, this.GetPlayerSex(latestPlayer));
            }
            else if (!this.IsDebug &&
                !this.tractorPlayer.CurrentTrickState.serverLocalCache.muteSound) {
                var soundInex = winResult;
                if (winResult > 0)
                    soundInex = this.tractorPlayer.playerLocalCache.WinResult;
                this.gameScene.playAudio(soundInex, this.GetPlayerSex(latestPlayer));
            }
            this.drawingFormHelper.DrawShowedCardsByPosition(showedCards, position);
        }
        // 如果正在回看，且：
        // - 如果设置“仅自己出牌时才自动退出上轮回看模式”开启，自己刚刚出了牌
        // - 或者有人刚刚出了牌
        // 则重置回看，重新画牌
        if (this.tractorPlayer.ShowLastTrickCards && (this.gameScene.onlyMeShowCardCancelLastTrickView.toLowerCase() !== "true" || latestPlayer == this.tractorPlayer.PlayerId)) {
            this.HandleRightClickEmptyArea();
        }
        //即时更新旁观手牌
        if (this.tractorPlayer.isObserver && this.tractorPlayer.PlayerId == latestPlayer) {
            this.tractorPlayer.CurrentPoker.CloneFrom(this.tractorPlayer.CurrentHandState.PlayerHoldingCards[this.tractorPlayer.PlayerId]);
            this.drawingFormHelper.removeCardImage(showedCards);
            this.drawingFormHelper.ResortMyHandCards();
        }
        if (winResult > 0) {
            this.drawingFormHelper.DrawOverridingFlag(showedCards.length, this.PlayerPosition[this.tractorPlayer.playerLocalCache.WinnderID], this.tractorPlayer.playerLocalCache.WinResult - 1, true);
            //拖拉机动画
            var showedPoker_1 = new CurrentPoker();
            showedPoker_1.Trump = this.tractorPlayer.CurrentTrickState.Trump;
            showedPoker_1.Rank = this.tractorPlayer.CurrentTrickState.Rank;
            showedCards.forEach(function (card) {
                showedPoker_1.AddCard(card);
            });
            var showedTractors = void 0;
            if (winResult < 3) {
                showedTractors = showedPoker_1.GetTractorBySuit(this.tractorPlayer.CurrentTrickState.LeadingSuit());
            }
            else {
                showedTractors = showedPoker_1.GetTractorBySuit(this.tractorPlayer.CurrentHandState.Trump);
            }
            if (showedTractors.length > 1)
                this.drawingFormHelper.DrawMovingTractorByPosition(showedCards.length, position);
        }
        this.RobotPlayFollowing();
    };
    //托管代打
    MainForm.prototype.RobotPlayFollowing = function () {
        var _this = this;
        if (this.tractorPlayer.isObserver)
            return;
        //跟出
        if ((this.tractorPlayer.playerLocalCache.isLastTrick || this.IsDebug) && !this.tractorPlayer.isObserver &&
            this.tractorPlayer.CurrentTrickState.NextPlayer() == this.tractorPlayer.PlayerId &&
            this.tractorPlayer.CurrentTrickState.IsStarted()) {
            var tempSelectedCards = [];
            Algorithm.MustSelectedCards(tempSelectedCards, this.tractorPlayer.CurrentTrickState, this.tractorPlayer.CurrentPoker);
            this.SelectedCards = [];
            var myCardsNumber = this.gameScene.cardImages;
            for (var i = 0; i < myCardsNumber.length; i++) {
                var serverCardNumber = parseInt(myCardsNumber[i].getAttribute("serverCardNumber"));
                if (tempSelectedCards.includes(serverCardNumber)) {
                    this.SelectedCards.push(serverCardNumber);
                    tempSelectedCards = CommonMethods.ArrayRemoveOneByValue(tempSelectedCards, serverCardNumber);
                }
            }
            var showingCardsValidationResult = TractorRules.IsValid(this.tractorPlayer.CurrentTrickState, this.SelectedCards, this.tractorPlayer.CurrentPoker);
            if (showingCardsValidationResult.ResultType == ShowingCardsValidationResult.ShowingCardsValidationResultType.Valid) {
                setTimeout(function () {
                    _this.ToShowCards();
                }, 250);
            }
            else {
                alert("failed to auto select cards: ".concat(this.SelectedCards, ", please manually select"));
            }
            return;
        }
        //跟选：如果玩家没有事先手动选牌，在有必选牌的情况下自动选择必选牌，方便玩家快捷出牌
        if (this.SelectedCards.length == 0 &&
            !this.tractorPlayer.isObserver &&
            this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Playing &&
            this.tractorPlayer.CurrentTrickState.NextPlayer() == this.tractorPlayer.PlayerId &&
            this.tractorPlayer.CurrentTrickState.IsStarted()) {
            //如果选了牌，则重画手牌，方便直接点确定出牌
            var tempSelectedCards = [];
            Algorithm.MustSelectedCardsNoShow(tempSelectedCards, this.tractorPlayer.CurrentTrickState, this.tractorPlayer.CurrentPoker);
            if (tempSelectedCards.length > 0) {
                this.SelectedCards = [];
                var myCardsNumber = this.gameScene.cardImages;
                for (var i = 0; i < myCardsNumber.length; i++) {
                    var serverCardNumber = parseInt(myCardsNumber[i].getAttribute("serverCardNumber"));
                    if (tempSelectedCards.includes(serverCardNumber)) {
                        this.myCardIsReady[i] = true;
                        this.SelectedCards.push(serverCardNumber);
                        tempSelectedCards = CommonMethods.ArrayRemoveOneByValue(tempSelectedCards, serverCardNumber);
                        //将选定的牌向上提升 via gameScene.cardImages
                        var toAddImage = this.gameScene.cardImages[i];
                        if (!toAddImage || !toAddImage.getAttribute("status") || toAddImage.getAttribute("status") === "down") {
                            toAddImage.setAttribute("status", "up");
                            toAddImage.style.transform = "translate(0px, -".concat(CommonMethods.cardTiltHeight, "px)");
                        }
                    }
                }
                this.gameScene.sendMessageToServer(CardsReady_REQUEST, this.tractorPlayer.MyOwnId, JSON.stringify(this.myCardIsReady));
            }
        }
        this.drawingFormHelper.validateSelectedCards();
    };
    //托管代打，先手
    MainForm.prototype.RobotPlayStarting = function () {
        var _this = this;
        if (this.IsDebug && !this.tractorPlayer.isObserver &&
            (this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Playing || this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8CardsFinished)) {
            if (!this.tractorPlayer.CurrentTrickState.Learder)
                return;
            if (this.tractorPlayer.CurrentTrickState.NextPlayer() != this.tractorPlayer.PlayerId)
                return;
            if (this.tractorPlayer.CurrentTrickState.IsStarted())
                return;
            this.SelectedCards = [];
            Algorithm.ShouldSelectedCards(this.SelectedCards, this.tractorPlayer.CurrentTrickState, this.tractorPlayer.CurrentPoker);
            var showingCardsValidationResult = TractorRules.IsValid(this.tractorPlayer.CurrentTrickState, this.SelectedCards, this.tractorPlayer.CurrentPoker);
            if (showingCardsValidationResult.ResultType == ShowingCardsValidationResult.ShowingCardsValidationResultType.Valid) {
                setTimeout(function () {
                    _this.ToShowCards();
                }, 250);
            }
            else {
                alert("failed to auto select cards: ".concat(this.SelectedCards, ", please manually select"));
            }
        }
    };
    MainForm.prototype.TrickFinished = function () {
        this.drawingFormHelper.DrawScoreImageAndCards();
    };
    MainForm.prototype.TrickStarted = function () {
        if (!this.IsDebug && this.tractorPlayer.CurrentTrickState.Learder == this.tractorPlayer.PlayerId) {
            this.drawingFormHelper.DrawMyPlayingCards();
        }
        this.RobotPlayStarting();
    };
    MainForm.prototype.init = function () {
        //每次初始化都重绘背景
        this.tractorPlayer.destroyAllClientMessages();
        this.drawingFormHelper.destroyAllCards();
        this.drawingFormHelper.destroyAllShowedCards();
        this.drawingFormHelper.destroyToolbar();
        this.drawingFormHelper.destroyScoreImageAndCards();
        this.drawingFormHelper.destroyLast8Cards();
        this.drawingFormHelper.DrawSidebarFull();
    };
    MainForm.prototype.setStartLabels = function () {
        var onesTurnPlayerID = "";
        var isShowCards = false;
        if (this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8Cards) {
            onesTurnPlayerID = this.tractorPlayer.CurrentHandState.Last8Holder;
            isShowCards = false;
        }
        else if (this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Playing &&
            this.tractorPlayer.CurrentTrickState.ShowedCards.length > 0) {
            onesTurnPlayerID = this.tractorPlayer.CurrentTrickState.NextPlayer();
            isShowCards = true;
        }
        var curIndex = CommonMethods.GetPlayerIndexByID(this.tractorPlayer.CurrentGameState.Players, this.tractorPlayer.PlayerId);
        if (curIndex < 0)
            return;
        for (var i = 0; i < 4; i++) {
            this.gameScene.ui.pokerPlayerStartersLabel[i].style.color = "orange";
            var curPlayer = this.tractorPlayer.CurrentGameState.Players[curIndex];
            var isUsingQiangliangka = false;
            if (curPlayer &&
                curPlayer.IsQiangliang &&
                (this.tractorPlayer.CurrentHandState.CurrentHandStep <= SuitEnums.HandStep.DistributingCards || this.tractorPlayer.CurrentHandState.CurrentHandStep >= SuitEnums.HandStep.SpecialEnding)) {
                var shengbi = 0;
                if (this.DaojuInfo && this.DaojuInfo.daojuInfoByPlayer && this.DaojuInfo.daojuInfoByPlayer[curPlayer.PlayerId]) {
                    shengbi = parseInt(this.DaojuInfo.daojuInfoByPlayer[curPlayer.PlayerId].Shengbi);
                }
                isUsingQiangliangka = shengbi >= CommonMethods.qiangliangkaCost;
            }
            if (curPlayer && curPlayer.IsOffline) {
                this.gameScene.ui.pokerPlayerStartersLabel[i].innerHTML = "离线中";
            }
            else {
                if (curPlayer && !curPlayer.IsReadyToStart) {
                    this.gameScene.ui.pokerPlayerStartersLabel[i].innerHTML = "\u601D\u7D22\u4E2D";
                }
                else {
                    if (curPlayer && onesTurnPlayerID && curPlayer.PlayerId === onesTurnPlayerID) {
                        this.gameScene.ui.pokerPlayerStartersLabel[i].innerHTML = isShowCards ? "出牌中" : "埋底中";
                        this.gameScene.ui.pokerPlayerStartersLabel[i].style.color = "yellow";
                    }
                    else if (curPlayer && this.tractorPlayer.CurrentHandState.Starter && curPlayer.PlayerId == this.tractorPlayer.CurrentHandState.Starter) {
                        this.gameScene.ui.pokerPlayerStartersLabel[i].innerHTML = "庄家";
                    }
                    else {
                        this.gameScene.ui.pokerPlayerStartersLabel[i].innerHTML = "".concat(curIndex + 1);
                    }
                }
                if (curPlayer && curPlayer.IsRobot) {
                    var suffix = curPlayer.PlayerId.endsWith('[bot]') ? "[bot]" : "【托】";
                    this.gameScene.ui.pokerPlayerStartersLabel[i].innerHTML = "".concat(this.gameScene.ui.pokerPlayerStartersLabel[i].innerHTML, suffix);
                }
                if (isUsingQiangliangka) {
                    this.gameScene.ui.pokerPlayerStartersLabel[i].innerHTML = "".concat(this.gameScene.ui.pokerPlayerStartersLabel[i].innerHTML, "\u3010\u62A2\u3011");
                }
            }
            curIndex = (curIndex + 1) % 4;
        }
    };
    MainForm.prototype.UpdateRobotButtonStatus = function () {
        if (!this.gameScene.ui.btnRobot) return;
        var step = this.tractorPlayer.CurrentHandState.CurrentHandStep;
        var myOwnId = this.tractorPlayer.MyOwnId;
        var shengbi = 0;
        if (this.DaojuInfo && this.DaojuInfo.daojuInfoByPlayer && this.DaojuInfo.daojuInfoByPlayer[myOwnId]) {
            shengbi = parseInt(this.DaojuInfo.daojuInfoByPlayer[myOwnId].Shengbi);
        }

        // 机器人/托管按钮逻辑
        var canRobot = (step >= SuitEnums.HandStep.DiscardingLast8Cards && step <= SuitEnums.HandStep.Playing);
        if (canRobot && !this.tractorPlayer.isObserver) {
            this.gameScene.ui.btnRobot.classList.remove('disabled');
            this.gameScene.ui.btnRobot.classList.add('pointerdiv');
        } else {
            this.gameScene.ui.btnRobot.classList.add('disabled');
            this.gameScene.ui.btnRobot.classList.remove('pointerdiv');
            // 托管最多到本局结束：如果已经结束且还在托管，则取消之
            if (this.IsDebug && step >= SuitEnums.HandStep.Ending) { this.PlayerToggleIsRobot(false); }
        }

        // 抢亮按钮逻辑
        if (this.gameScene.ui.btnQiangliang) {
            var isReady = false;
            var me = this.tractorPlayer.CurrentGameState.Players.find(p => p.PlayerId === this.tractorPlayer.MyOwnId);
            if (me) isReady = me.IsReadyToStart;

            // 修正：只有在发牌过程中 (Step 1) 才允许点击
            var canQiangliang = (step === SuitEnums.HandStep.DistributingCards && shengbi >= CommonMethods.qiangliangkaCost);
            
            if (canQiangliang && !this.tractorPlayer.isObserver) {
                this.gameScene.ui.btnQiangliang.classList.remove('disabled');
                this.gameScene.ui.btnQiangliang.classList.add('pointerdiv');
            } else {
                // 如果已经激活了，但在发牌结束或之后，自动帮玩家点掉“取消”
                if (this.IsQiangliang && step >= SuitEnums.HandStep.DistributingCardsFinished) {
                    this.btnQiangliang_Click(); 
                }
                this.gameScene.ui.btnQiangliang.classList.add('disabled');
                this.gameScene.ui.btnQiangliang.classList.remove('pointerdiv');
            }
        }

        // 上树按钮逻辑 (btnExitAndObserve)
        if (this.gameScene.ui.btnExitAndObserve) {
            // 只有在未开局或局后允许上树
            var isIdle = (step === SuitEnums.HandStep.BeforeDistributingCards || step === SuitEnums.HandStep.Ending);
            var otherRealSeated = this.tractorPlayer.CurrentGameState.Players.filter(p => p && p.PlayerId && !p.PlayerId.endsWith('[bot]') && !p.PlayerId.startsWith('[空位') && p.PlayerId !== this.tractorPlayer.MyOwnId).length;
            
            // 如果我是房主，必须有其他真人坐着才能上树
            var canObserve = isIdle && (!this.tractorPlayer.isObserver) && (this.tractorPlayer.CurrentRoomSetting.RoomOwner !== this.tractorPlayer.MyOwnId || otherRealSeated > 0);

            if (canObserve) {
                this.gameScene.ui.btnExitAndObserve.classList.remove('disabled');
                this.gameScene.ui.btnExitAndObserve.classList.add('pointerdiv');
            } else {
                this.gameScene.ui.btnExitAndObserve.classList.add('disabled');
                this.gameScene.ui.btnExitAndObserve.classList.remove('pointerdiv');
            }
        }

        // 设置按钮逻辑 (btnSettings)
        if (this.gameScene.ui.btnSettings) {
            if (this.tractorPlayer.isObserver) {
                this.gameScene.ui.btnSettings.classList.add('disabled');
                this.gameScene.ui.btnSettings.classList.remove('pointerdiv');
            } else {
                this.gameScene.ui.btnSettings.classList.remove('disabled');
                this.gameScene.ui.btnSettings.classList.add('pointerdiv');
            }
        }

        // 暂停/继续按钮逻辑 (btnPauseOrContinueGame) - 核心修复：视觉显式置灰
        if (this.gameScene.ui.btnPauseOrContinueGame) {
            var isPlaying = (step === SuitEnums.HandStep.Playing);
            if (isPlaying) {
                this.gameScene.ui.btnPauseOrContinueGame.classList.remove('disabled');
                this.gameScene.ui.btnPauseOrContinueGame.classList.add('pointerdiv');
                this.gameScene.ui.btnPauseOrContinueGame.style.opacity = "1";
                this.gameScene.ui.btnPauseOrContinueGame.style.filter = "none";
            } else {
                this.gameScene.ui.btnPauseOrContinueGame.classList.add('disabled');
                this.gameScene.ui.btnPauseOrContinueGame.classList.remove('pointerdiv');
                this.gameScene.ui.btnPauseOrContinueGame.style.opacity = "0.5";
                this.gameScene.ui.btnPauseOrContinueGame.style.filter = "grayscale(1)";
            }
        }
    };
    MainForm.prototype.btnReady_Click = function () {
        if (!this.gameScene.ui.btnReady || this.gameScene.ui.btnReady.classList.contains('hidden') || this.gameScene.ui.btnReady.classList.contains('disabled'))
            return;
        //为防止以外连续点两下开始按钮，造成重复发牌，点完一下就立即disable开始按钮
        this.gameScene.ui.btnReady.classList.add('disabled');
        this.gameScene.ui.btnReady.classList.remove('pointerdiv');
        console.log("===btnReady_Click attempted");
        this.gameScene.sendMessageToServer(ReadyToStart_REQUEST, this.tractorPlayer.PlayerId, "");
        console.log("===btnReady_Click done");
    };
    MainForm.prototype.btnQiangliang_Click = function () {
        if (!this.gameScene.ui.btnQiangliang || this.gameScene.ui.btnQiangliang.classList.contains('hidden') || this.gameScene.ui.btnQiangliang.classList.contains('disabled'))
            return;
        this.gameScene.sendMessageToServer(ToggleIsQiangliang_REQUEST, this.tractorPlayer.PlayerId, this.gameScene.qiangliangMin);
    };
    MainForm.prototype.btnRobot_Click = function () {
        if (!this.gameScene.ui.btnRobot || this.gameScene.ui.btnRobot.classList.contains('hidden') || this.gameScene.ui.btnRobot.classList.contains('disabled'))
            return;
        this.gameScene.sendMessageToServer(ToggleIsRobot_REQUEST, this.tractorPlayer.PlayerId, "");
    };
    MainForm.prototype.btnQiandao_Click = function () {
        if (!this.gameScene.ui.btnQiandao || this.gameScene.ui.btnQiandao.classList.contains('hidden') || this.gameScene.ui.btnQiandao.classList.contains('disabled'))
            return;
        this.gameScene.sendMessageToServer(PLAYER_QIANDAO_REQUEST, this.gameScene.playerName, "");
    };
    // pos is 1-based
    MainForm.prototype.observeByPosition = function (pos) {
        if (this.tractorPlayer.isObserver && this.PositionPlayer[pos]) {
            this.gameScene.sendMessageToServer(ObserveNext_REQUEST, this.tractorPlayer.MyOwnId, this.PositionPlayer[pos]);
        }
    };
    // pos is 1-based
    MainForm.prototype.bootPlayerByPosition = function (pos) {
        if (this.PositionPlayer[pos]) {
            var playerID = this.PositionPlayer[pos];
            this.gameScene.sendMessageToServer(ExitRoom_REQUEST, playerID, "".concat(ExitRoom_REQUEST_TYPE_BootPlayer));
        }
    };
    MainForm.prototype.LoadUIUponConnect = function () {
        var _this = this;
        if (!this.gameScene.isReplayMode) {
            this.gameScene.ui.btnQiandao = this.gameScene.ui.create.system('签到领福利', function () { _this.btnQiandao_Click(); }, true);
            this.gameScene.ui.btnQiandao.hide();
        }
        this.EnableShortcutKeys();
        this.gameScene.ui.gameSettings = this.gameScene.ui.create.system('设置', function () { return _this.btnGameSettings_Click(); }, true);
        this.gameScene.ui.exitTractor = this.gameScene.ui.create.system('退出', function () { return _this.btnExitRoom_Click(); }, true);
    };
    MainForm.prototype.btnGameSettings_Click = function () {
        var _this = this;
        if (this.gameScene.ui.inputFormWrapper)
            return;
        var inputFormWrapper = this.gameScene.ui.create.div(this.gameScene.ui.frameMain);
        inputFormWrapper.id = "inputFormWrapper";
        inputFormWrapper.style.position = 'absolute';
        inputFormWrapper.style.top = 'calc(25%)';
        inputFormWrapper.style.left = 'calc(25%)';
        inputFormWrapper.style.width = 'calc(50%)';
        inputFormWrapper.style.height = 'calc(50%)';
        inputFormWrapper.style.color = 'black';
        inputFormWrapper.style.textShadow = 'none';
        inputFormWrapper.style.zIndex = CommonMethods.zIndexSettingsForm;
        this.gameScene.ui.inputFormWrapper = inputFormWrapper;
        jQuery(inputFormWrapper).load("game/tractor/src/text/settings_form.htm", function (response, status, xhr) { _this.renderSettingsForm(response, status, xhr, _this.gameScene); });
    };
    MainForm.prototype.renderSettingsForm = function (response, status, xhr, gs) {
        var _this = this;
        if (status == "error") {
            var msg = "renderSettingsForm error: ";
            console.log(msg + xhr.status + " " + xhr.statusText);
            return;
        }
        if (!gs.ui.inputFormWrapper)
            return;
        var txtMaxReplays = document.getElementById("txtMaxReplays");
        txtMaxReplays.value = IDBHelper.maxReplays;
        txtMaxReplays.oninput = function () {
            var maxString = txtMaxReplays.value;
            var maxInt = 0;
            if (CommonMethods.IsNumber(maxString)) {
                maxInt = Math.max(maxInt, parseInt(maxString));
            }
            IDBHelper.maxReplays = maxInt;
            gs.game.saveConfig("maxReplays", maxInt);
        };
        var divReplayCount = document.getElementById("divReplayCount");
        IDBHelper.GetReplayCount(divReplayCount);
        var btnCleanupReplays = document.getElementById("btnCleanupReplays");
        btnCleanupReplays.onclick = function () {
            var c = window.confirm("你确定要清空所有录像文件吗？");
            if (c === false) {
                return;
            }
            IDBHelper.CleanupReplayEntity(function () {
                _this.ReinitReplayEntities(_this);
                if (gs.isReplayMode)
                    _this.tractorPlayer.NotifyMessage(["已尝试清空全部录像文件"]);
            });
            _this.resetGameRoomUI();
        };
        var btnCleanupLocalResources = document.getElementById("btnCleanupLocalResources");
        btnCleanupLocalResources.onclick = function () {
            var c = window.confirm("你确定要清空缓存资源并刷新吗？");
            if (c === false) {
                return;
            }
            IDBHelper.CleanupAvatarResources(function () {
                localStorage.removeItem(CommonMethods.storageFileForCardsKey);
                window.location.reload();
            });
        };
        var btnExportZipFile = document.getElementById("btnExportZipFile");
        btnExportZipFile.onclick = function () {
            FileHelper.ExportZipFile();
            _this.resetGameRoomUI();
        };
        var inputRecordingFile = document.getElementById("inputRecordingFile");
        inputRecordingFile.onchange = function () {
            var fileName = inputRecordingFile.value;
            var extension = fileName.split('.').pop();
            if (!["json", "zip"].includes(extension.toLowerCase())) {
                alert("unsupported file type!");
                return;
            }
            if (!inputRecordingFile || !inputRecordingFile.files || inputRecordingFile.files.length <= 0) {
                alert("No file has been selected!");
                return;
            }
            if (extension.toLowerCase() === "json") {
                FileHelper.ImportJsonFile(inputRecordingFile.files[0], function () {
                    _this.ReinitReplayEntities(_this);
                    if (gs.isReplayMode)
                        _this.tractorPlayer.NotifyMessage(["已尝试加载本地录像文件"]);
                });
            }
            else {
                FileHelper.ImportZipFile(inputRecordingFile.files[0], function () {
                    _this.ReinitReplayEntities(_this);
                    if (gs.isReplayMode)
                        _this.tractorPlayer.NotifyMessage(["已尝试加载本地录像文件"]);
                });
            }
            _this.resetGameRoomUI();
        };
        var cbxUseCardUIStyleClassic = document.getElementById("cbxUseCardUIStyleClassic");
        cbxUseCardUIStyleClassic.checked = gs.useCardUIStyleClassic;
        cbxUseCardUIStyleClassic.onchange = function () {
            gs.useCardUIStyleClassic = cbxUseCardUIStyleClassic.checked;
            gs.game.saveConfig("useCardUIStyleClassic", gs.useCardUIStyleClassic);
        };
        var noDanmu = document.getElementById("cbxNoDanmu");
        noDanmu.checked = gs.noDanmu.toLowerCase() === "true";
        noDanmu.onchange = function () {
            gs.noDanmu = noDanmu.checked.toString();
            gs.game.saveConfig("noDanmu", gs.noDanmu);
        };
        var cbxHidePlayerID = document.getElementById("cbxHidePlayerID");
        cbxHidePlayerID.checked = gs.hidePlayerID;
        cbxHidePlayerID.onchange = function () {
            gs.hidePlayerID = cbxHidePlayerID.checked;
            gs.game.saveConfig("hidePlayerID", gs.hidePlayerID);
        };
        var cbxCutCards = document.getElementById("cbxCutCards");
        cbxCutCards.checked = gs.noCutCards.toLowerCase() === "true";
        cbxCutCards.onchange = function () {
            gs.noCutCards = cbxCutCards.checked.toString();
            gs.game.saveConfig("noCutCards", gs.noCutCards);
        };
        var cbxYesDragSelect = document.getElementById("cbxYesDragSelect");
        cbxYesDragSelect.checked = gs.yesDragSelect.toLowerCase() === "true";
        cbxYesDragSelect.onchange = function () {
            gs.yesDragSelect = cbxYesDragSelect.checked.toString();
            gs.game.saveConfig("yesDragSelect", gs.yesDragSelect);
        };
        var cbxOnlyMeShowCardCancelLastTrickView = document.getElementById("cbxOnlyMeShowCardCancelLastTrickView");
        cbxOnlyMeShowCardCancelLastTrickView.checked = gs.onlyMeShowCardCancelLastTrickView.toLowerCase() === "true";
        cbxOnlyMeShowCardCancelLastTrickView.onchange = function () {
            gs.onlyMeShowCardCancelLastTrickView = cbxOnlyMeShowCardCancelLastTrickView.checked.toString();
            gs.game.saveConfig("onlyMeShowCardCancelLastTrickView", gs.onlyMeShowCardCancelLastTrickView);
        };
        var noTouchDevice = document.getElementById("cbxNoTouchDevice");
        noTouchDevice.checked = gs.noTouchDevice.toLowerCase() === "true";
        noTouchDevice.onchange = function () {
            gs.noTouchDevice = noTouchDevice.checked.toString();
            gs.game.saveConfig("noTouchDevice", gs.noTouchDevice);
        };
        if (gs.isReplayMode)
            return;
        // 以下为需要连接服务器才能显示的设置
        var pNoDongtu = document.getElementById("pNoDongtu");
        pNoDongtu.style.display = "block";
        var noDongtuUntilExpDate = document.getElementById("lblNoDongtuUntilExpDate");
        if (!this.isNoDongtuUntilExpired(this.DaojuInfo)) {
            noDongtuUntilExpDate.style.display = "block";
            noDongtuUntilExpDate.innerHTML = "\u6709\u6548\u671F\u81F3".concat(this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId].noDongtuUntil);
        }
        var noDongtu = document.getElementById("cbxNoDongtu");
        noDongtu.checked = gs.noDongtu.toLowerCase() === "true";
        noDongtu.onchange = function () {
            if (noDongtu.checked && _this.isNoDongtuUntilExpired(_this.DaojuInfo)) {
                noDongtu.checked = false;
                _this.buyNoDongtuUntil();
            }
            else {
                gs.noDongtu = noDongtu.checked.toString();
                gs.game.saveConfig("noDongtu", gs.noDongtu);
                _this.UpdateSkinStatus();
            }
        };
        // 游戏道具栏
        var divDaojuWrapper = document.getElementById("divDaojuWrapper");
        divDaojuWrapper.style.display = "block";
        // 升币
        var lblShengbi = document.getElementById("lblShengbi");
        var shengbiNum = 0;
        if (this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId]) {
            shengbiNum = this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId].Shengbi;
        }
        lblShengbi.innerHTML = shengbiNum;
        var btnShengbiLeadingBoard = document.getElementById("btnShengbiLeadingBoard");
        btnShengbiLeadingBoard.onclick = function () {
            var divShengbiLeadingBoard = document.getElementById("divShengbiLeadingBoard");
            divShengbiLeadingBoard.style.width = "100%";
            divShengbiLeadingBoard.innerHTML = "";
            var shengbiLeadingBoard = _this.DaojuInfo.shengbiLeadingBoard;
            if (!shengbiLeadingBoard)
                return;
            var sortable = [];
            for (var _i = 0, _a = Object.entries(shengbiLeadingBoard); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                sortable.push([key, value]);
            }
            sortable.sort(function (a, b) {
                return a[1] !== b[1] ? -1 * (a[1] - b[1]) : (a[0] <= b[0] ? -1 : 1);
            });
            var ul = document.createElement("ul");
            for (var i = 0; i < sortable.length; i++) {
                var li = document.createElement("li");
                li.innerText = "\u3010".concat(sortable[i][0], "\u3011").concat(sortable[i][1]);
                ul.appendChild(li);
            }
            divShengbiLeadingBoard.appendChild(ul);
        };
        // 抢亮卡
        var selectQiangliangMin = document.getElementById("selectQiangliangMin");
        selectQiangliangMin.value = gs.qiangliangMin;
        selectQiangliangMin.onchange = function () {
            gs.qiangliangMin = selectQiangliangMin.value;
            gs.game.saveConfig("qiangliangMin", gs.qiangliangMin);
        };
        // 皮肤
        var selectFullSkinInfo = document.getElementById("selectFullSkinInfo");
        this.UpdateSkinInfoUI(false);
        selectFullSkinInfo.onchange = function () {
            _this.UpdateSkinInfoUI(true);
        };
        var btnBuyOrUseSelectedSkin = document.getElementById("btnBuyOrUseSelectedSkin");
        btnBuyOrUseSelectedSkin.onclick = function () {
            var skinName = selectFullSkinInfo.value;
            var isSkinOwned = _this.IsSkinOwned(skinName);
            if (isSkinOwned) {
                gs.sendMessageToServer(BUY_USE_SKIN_REQUEST, _this.tractorPlayer.MyOwnId, skinName);
                // 传入 true，告知关闭窗口时不要立即重刷皮肤，等待服务器确认
                _this.resetGameRoomUI(true); 
                return;
            }
            var isSkinAfordableWithConfMsg = _this.IsSkinAfordableWithConfMsg(skinName);
            var isSkinAfordable = isSkinAfordableWithConfMsg[0];
            if (!isSkinAfordable) {
                alert("升币余额不足，无法购买此皮肤");
            }
            else {
                var doTransaction = true;
                var msg_1 = isSkinAfordableWithConfMsg[1];
                if (msg_1 && msg_1.length > 0) {
                    var c = window.confirm(msg_1);
                    if (!c) {
                        doTransaction = false;
                    }
                }
                if (doTransaction) {
                    gs.sendMessageToServer(BUY_USE_SKIN_REQUEST, _this.tractorPlayer.MyOwnId, skinName);
                    _this.resetGameRoomUI(true);
                }
            }
        };
        if (gs.isInGameRoom()) {
            var cbxNoOverridingFlag_1 = document.getElementById("cbxNoOverridingFlag");
            cbxNoOverridingFlag_1.checked = this.tractorPlayer.CurrentRoomSetting.HideOverridingFlag;
            cbxNoOverridingFlag_1.onchange = function () {
                _this.tractorPlayer.CurrentRoomSetting.HideOverridingFlag = cbxNoOverridingFlag_1.checked;
                gs.sendMessageToServer(SaveRoomSetting_REQUEST, _this.tractorPlayer.MyOwnId, JSON.stringify(_this.tractorPlayer.CurrentRoomSetting));
            };
            var cbxNoSignalCard_1 = document.getElementById("cbxNoSignalCard");
            cbxNoSignalCard_1.checked = !this.tractorPlayer.CurrentRoomSetting.DisplaySignalCardInfo;
            cbxNoSignalCard_1.onchange = function () {
                _this.tractorPlayer.CurrentRoomSetting.DisplaySignalCardInfo = !cbxNoSignalCard_1.checked;
                gs.sendMessageToServer(SaveRoomSetting_REQUEST, _this.tractorPlayer.MyOwnId, JSON.stringify(_this.tractorPlayer.CurrentRoomSetting));
            };
            var selectIsGameCasual_1 = document.getElementById("selectIsGameCasual");
            selectIsGameCasual_1.value = this.tractorPlayer.CurrentRoomSetting.IsGameCasual;
            selectIsGameCasual_1.onchange = function () {
                _this.tractorPlayer.CurrentRoomSetting.IsGameCasual = Number(selectIsGameCasual_1.value);
                gs.sendMessageToServer(SaveRoomSetting_REQUEST, _this.tractorPlayer.MyOwnId, JSON.stringify(_this.tractorPlayer.CurrentRoomSetting));
            };
            var selectSecondsToShowCards_1 = document.getElementById("selectSecondsToShowCards");
            selectSecondsToShowCards_1.value = this.tractorPlayer.CurrentRoomSetting.secondsToShowCards;
            selectSecondsToShowCards_1.onchange = function () {
                _this.tractorPlayer.CurrentRoomSetting.secondsToShowCards = Number(selectSecondsToShowCards_1.value);
                gs.sendMessageToServer(SaveRoomSetting_REQUEST, _this.tractorPlayer.MyOwnId, JSON.stringify(_this.tractorPlayer.CurrentRoomSetting));
            };
            var selectSecondsToDiscardCards_1 = document.getElementById("selectSecondsToDiscardCards");
            selectSecondsToDiscardCards_1.value = this.tractorPlayer.CurrentRoomSetting.secondsToDiscardCards;
            selectSecondsToDiscardCards_1.onchange = function () {
                _this.tractorPlayer.CurrentRoomSetting.secondsToDiscardCards = Number(selectSecondsToDiscardCards_1.value);
                gs.sendMessageToServer(SaveRoomSetting_REQUEST, _this.tractorPlayer.MyOwnId, JSON.stringify(_this.tractorPlayer.CurrentRoomSetting));
            };
            var selectStarter_1 = document.getElementById("selectStarter");
            for (var i = 0; i < this.tractorPlayer.CurrentGameState.Players.length; i++) {
                var p = this.tractorPlayer.CurrentGameState.Players[i];
                if (p) {
                    var optionElement = document.createElement("option");
                    optionElement.value = p.PlayerId;
                    optionElement.text = p.PlayerId;
                    selectStarter_1.add(optionElement);
                }
            }
            if (this.tractorPlayer.CurrentGameState.startNextHandStarter) {
                selectStarter_1.value = this.tractorPlayer.CurrentGameState.startNextHandStarter.PlayerId;
            }
            // let selectTeam1Rank: any = document.getElementById("selectTeam1Rank");
            // selectTeam1Rank.value = CommonMethods.GetRankByTeam(this.tractorPlayer.CurrentGameState.Players, 1);
            // let selectTeam2Rank: any = document.getElementById("selectTeam2Rank");
            // selectTeam2Rank.value = CommonMethods.GetRankByTeam(this.tractorPlayer.CurrentGameState.Players, 2);
            var divRoomSettingsWrapper = document.getElementById("divRoomSettingsWrapper");
            divRoomSettingsWrapper.style.display = "block";
            if (this.tractorPlayer.CurrentRoomSetting.RoomOwner !== this.tractorPlayer.MyOwnId) {
                cbxNoOverridingFlag_1.disabled = true;
                cbxNoSignalCard_1.disabled = true;
                selectIsGameCasual_1.disabled = true;
                selectSecondsToShowCards_1.disabled = true;
                selectSecondsToDiscardCards_1.disabled = true;
                selectStarter_1.disabled = true;
                // selectTeam1Rank.disabled = true;
                // selectTeam2Rank.disabled = true;
                if (!this.tractorPlayer.isObserver) {
                    var btnBecomeRoomOwner = document.getElementById("btnBecomeRoomOwner");
                    btnBecomeRoomOwner.style.display = "inline";
                    btnBecomeRoomOwner.onclick = function () {
                        _this.tractorPlayer.CurrentRoomSetting.RoomOwner = _this.tractorPlayer.MyOwnId;
                        gs.sendMessageToServer(SaveRoomSetting_REQUEST, _this.tractorPlayer.MyOwnId, JSON.stringify(_this.tractorPlayer.CurrentRoomSetting));
                        _this.resetGameRoomUI();
                    };
                }
            }
            else {
                var divRoomSettings = document.getElementById("divRoomSettings");
                divRoomSettings.style.display = "block";
                var btnResumeGame = document.getElementById("btnResumeGame");
                btnResumeGame.onclick = function () {
                    if (CommonMethods.AllOnline(_this.tractorPlayer.CurrentGameState.Players) && !_this.tractorPlayer.isObserver && SuitEnums.HandStep.DistributingCards <= _this.tractorPlayer.CurrentHandState.CurrentHandStep && _this.tractorPlayer.CurrentHandState.CurrentHandStep <= SuitEnums.HandStep.Playing) {
                        alert("游戏中途不允许继续牌局,请完成此盘游戏后重试");
                    }
                    else {
                        gs.sendMessageToServer(ResumeGameFromFile_REQUEST, _this.tractorPlayer.MyOwnId, "");
                    }
                    _this.resetGameRoomUI();
                };
                var btnRandomSeat = document.getElementById("btnRandomSeat");
                btnRandomSeat.onclick = function () {
                    if (CommonMethods.AllOnline(_this.tractorPlayer.CurrentGameState.Players) && !_this.tractorPlayer.isObserver && SuitEnums.HandStep.DistributingCards <= _this.tractorPlayer.CurrentHandState.CurrentHandStep && _this.tractorPlayer.CurrentHandState.CurrentHandStep <= SuitEnums.HandStep.Playing) {
                        alert("游戏中途不允许随机组队,请完成此盘游戏后重试");
                    }
                    else {
                        gs.sendMessageToServer(RandomSeat_REQUEST, _this.tractorPlayer.MyOwnId, "");
                    }
                    _this.resetGameRoomUI();
                };
                var btnSwapSeat = document.getElementById("btnSwapSeat");
                btnSwapSeat.onclick = function () {
                    if (CommonMethods.AllOnline(_this.tractorPlayer.CurrentGameState.Players) && !_this.tractorPlayer.isObserver && SuitEnums.HandStep.DistributingCards <= _this.tractorPlayer.CurrentHandState.CurrentHandStep && _this.tractorPlayer.CurrentHandState.CurrentHandStep <= SuitEnums.HandStep.Playing) {
                        alert("游戏中途不允许互换座位,请完成此盘游戏后重试");
                    }
                    else {
                        var selectSwapSeat = document.getElementById("selectSwapSeat");
                        gs.sendMessageToServer(SwapSeat_REQUEST, _this.tractorPlayer.MyOwnId, selectSwapSeat.value);
                    }
                    _this.resetGameRoomUI();
                };
                var btnStarter = document.getElementById("btnStarter");
                btnStarter.style.display = "inline";
                btnStarter.onclick = function () {
                    if (CommonMethods.AllOnline(_this.tractorPlayer.CurrentGameState.Players) && !_this.tractorPlayer.isObserver && SuitEnums.HandStep.DistributingCards <= _this.tractorPlayer.CurrentHandState.CurrentHandStep && _this.tractorPlayer.CurrentHandState.CurrentHandStep <= SuitEnums.HandStep.Playing) {
                        alert("游戏中途不允许设置谁坐庄,请完成此盘游戏后重试");
                    }
                    else {
                        gs.sendMessageToServer(SetStarter_REQUEST, _this.tractorPlayer.MyOwnId, "".concat(selectStarter_1.value));
                    }
                    _this.resetGameRoomUI();
                };
                // let btnTeam1RankOK: any = document.getElementById("btnTeam1RankOK")
                // btnTeam1RankOK.style.display = "inline";
                // btnTeam1RankOK.onclick = () => {
                //     if (CommonMethods.AllOnline(this.tractorPlayer.CurrentGameState.Players) && !this.tractorPlayer.isObserver && SuitEnums.HandStep.DistributingCards <= this.tractorPlayer.CurrentHandState.CurrentHandStep && this.tractorPlayer.CurrentHandState.CurrentHandStep <= SuitEnums.HandStep.Playing) {
                //         alert("游戏中途不允许设置队伍打几,请完成此盘游戏后重试")
                //     } else {
                //         gs.sendMessageToServer(SetRankByTeam_REQUEST, this.tractorPlayer.MyOwnId, JSON.stringify([1, Number(selectTeam1Rank.value)]));
                //     }
                //     this.resetGameRoomUI();
                // };
                // let btnTeam2RankOK: any = document.getElementById("btnTeam2RankOK")
                // btnTeam2RankOK.style.display = "inline";
                // btnTeam2RankOK.onclick = () => {
                //     if (CommonMethods.AllOnline(this.tractorPlayer.CurrentGameState.Players) && !this.tractorPlayer.isObserver && SuitEnums.HandStep.DistributingCards <= this.tractorPlayer.CurrentHandState.CurrentHandStep && this.tractorPlayer.CurrentHandState.CurrentHandStep <= SuitEnums.HandStep.Playing) {
                //         alert("游戏中途不允许设置队伍打几,请完成此盘游戏后重试")
                //     } else {
                //         gs.sendMessageToServer(SetRankByTeam_REQUEST, this.tractorPlayer.MyOwnId, JSON.stringify([2, Number(selectTeam2Rank.value)]));
                //     }
                //     this.resetGameRoomUI();
                // };
            }
        }
    };
    MainForm.prototype.isNoDongtuUntilExpired = function (daojuInfo) {
        if (!daojuInfo || !daojuInfo.daojuInfoByPlayer || !daojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId] || !daojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId].noDongtuUntil)
            return true;
        var dExp = new Date(daojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId].noDongtuUntil);
        var dNow = new Date();
        return dExp < dNow;
    };
    MainForm.prototype.isChatBanned = function (pid) {
        if (!this.DaojuInfo || !this.DaojuInfo.daojuInfoByPlayer || !this.DaojuInfo.daojuInfoByPlayer[pid]) {
            return false;
        }
        if (this.DaojuInfo.daojuInfoByPlayer[pid].noChatUntil) {
            var dBanned = new Date(this.DaojuInfo.daojuInfoByPlayer[pid].noChatUntil);
            var dNow = new Date();
            return dNow < dBanned;
        }
        return false;
    };
    // 核心集成优化：退出即清理凭据，显示离线画面
    MainForm.prototype.btnExitRoom_Click = function () {
        var _this = this;
        if (this.gameScene.isReplayMode) {
            window.location.reload();
            return;
        }
        if (this.gameScene.isInGameRoom()) {
            // 核心功能：逃跑二次确认
            var step = this.tractorPlayer.CurrentHandState.CurrentHandStep;
            var initialReal = this.tractorPlayer.CurrentHandState.InitialRealCount;
            // 如果在对局中 (1-8)，且开局真人 >= 3，执行警告
            if (step >= SuitEnums.HandStep.DistributingCards && step <= SuitEnums.HandStep.Playing && initialReal >= 3) {
                // 进一步检查是否还有其他活跃真人（后端最后一人豁免逻辑的前置判断）
                var activeRealCount = this.tractorPlayer.CurrentGameState.Players.filter(function(p) {
                    return p && !p.IsOffline && p.PlayerId.indexOf('[bot]') === -1 && p.PlayerId.indexOf('【逃】') === -1;
                }).length;

                if (activeRealCount > 1) {
                    var c = window.confirm("当前对局正在计分，退出将计入逃跑战绩！\n\n是否确定要逃离对局？");
                    if (!c) return;
                }
            }

            // 核心修复：点击退出时，立即清理下拉框中的所有“★”特殊命令
            var selectPresetMsgs = this.gameScene.ui.selectPresetMsgs;
            if (selectPresetMsgs) {
                for (var i = selectPresetMsgs.options.length - 1; i >= 0; i--) {
                    if (selectPresetMsgs.options[i].text.indexOf("★") === 0) {
                        selectPresetMsgs.remove(i);
                    }
                }
                // 仅保留管理员命令（如果此人是管理员）
                if (this.tractorPlayer.isAdmin) {
                    var adminOpt = document.createElement("option");
                    adminOpt.value = "命令：刷新游戏设置";
                    adminOpt.text = "★ 管理员：刷新游戏设置";
                    selectPresetMsgs.appendChild(adminOpt);
                }
            }
            this.gameScene.sendMessageToServer(ExitRoom_REQUEST, this.tractorPlayer.MyOwnId, "");
            return;
        }
        localStorage.removeItem('tractor_auto_sid');
        sessionStorage.setItem('isManualLogout', 'true');
        window.location.reload();
    };

    MainForm.prototype.showOfflineScreen = function (msg) {
        localStorage.removeItem('tractor_auto_sid');
        sessionStorage.setItem('isManualLogout', 'true');
        this.destroyGameRoom();
        this.destroyGameHall();
        if (this.gameScene.ui.frameMain) {
            while (this.gameScene.ui.frameMain.firstChild) {
                this.gameScene.ui.frameMain.removeChild(this.gameScene.ui.frameMain.firstChild);
            }
        }
        this.tractorPlayer.NotifyMessage([msg]);
        if (window.lib && window.lib.init && window.lib.init.onfree) {
            window.lib.init.onfree();
        }
    };    
    MainForm.prototype.clearManualLogout = function() {
        sessionStorage.removeItem('isManualLogout');
    };
    MainForm.prototype.handleSelectPresetMsgsClick = function (selectPresetMsgs) {
        if (this.selectPresetMsgsIsOpen) {
            this.selectPresetMsgsIsOpen = false;
            this.sendPresetMsgs(selectPresetMsgs);
        }
    };

    MainForm.prototype.showOfflineScreen = function (msg) {
        localStorage.removeItem("tractor_auto_sid");
        sessionStorage.setItem("isManualLogout", "true");
        this.destroyGameRoom();
        this.destroyGameHall();
        
        var overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0,0,0,0.85)";
        overlay.style.zIndex = "99999";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        document.body.appendChild(overlay);

        var text = document.createElement("div");
        text.innerText = msg;
        text.style.color = "yellow";
        text.style.fontSize = "30px";
        text.style.marginBottom = "20px";
        overlay.appendChild(text);

        var btn = document.createElement("div");
        btn.className = "menubutton highlight large";
        btn.innerText = "确定";
        btn.style.marginTop = "200px";
        btn.onclick = function() { window.location.reload(); };
        overlay.appendChild(btn);
    };
    MainForm.prototype.sendPresetMsgs = function (selectPresetMsgs) {
        var selectedIndex = selectPresetMsgs.selectedIndex;
        var selectedValue = selectPresetMsgs.value;
        var args = [selectedIndex, CommonMethods.GetRandomInt(CommonMethods.winEmojiLength), selectedValue];
        this.sendEmojiWithCheck(args);
    };
    MainForm.prototype.emojiSubmitEventhandler = function () {
        var emojiType = -1;
        var emojiIndex = -1;
        var msgString = "";
        if (!msgString) {
            msgString = this.gameScene.ui.selectPresetMsgs.value;
            emojiType = this.gameScene.ui.selectPresetMsgs.selectedIndex;
            emojiIndex = CommonMethods.GetRandomInt(CommonMethods.winEmojiLength);
        }
        else if (msgString.startsWith(CommonMethods.sendBroadcastPrefix)) {
            // SendBroadcast
            this.sendBroadcastMsgType(msgString);
            return;
        }
        var args = [emojiType, emojiIndex, msgString];
        this.sendEmojiWithCheck(args);
    };
    MainForm.prototype.sendBroadcastMsgType = function (msg) {
        if (this.isChatBanned(this.tractorPlayer.MyOwnId)) {
            alert("\u7981\u8A00\u751F\u6548\u4E2D\uFF0C\u8BF7\u5728\u89E3\u7981\u540E\u91CD\u8BD5\uFF0C\u89E3\u7981\u65E5\u671F\uFF1A".concat(this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId].noChatUntil));
            return;
        }
        var chatQuota = 0;
        var shengbi = 0;
        if (this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId]) {
            chatQuota = parseInt(this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId].ChatQuota);
            shengbi = parseInt(this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId].Shengbi);
        }
        if (chatQuota + shengbi < CommonMethods.sendBroadcastCost) {
            alert("聊天卡/升币余额不足，无法发送广播消息");
            return;
        }
        this.gameScene.sendMessageToServer(CommonMethods.SendBroadcast_REQUEST, this.tractorPlayer.MyOwnId, msg);
    };
    MainForm.prototype.buyNoDongtuUntil = function () {
        var shengbi = 0;
        if (this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId]) {
            shengbi = parseInt(this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId].Shengbi);
        }
        if (shengbi < CommonMethods.buyNoDongtuUntilCost) {
            alert("升币余额不足，无法关闭动图");
            return;
        }
        var msg = "\u6B64\u6B21\u8D2D\u4E70\u5C06\u6D88\u8017\u5347\u5E01\u3010".concat(CommonMethods.buyNoDongtuUntilCost, "\u3011\uFF0C\u8D2D\u4E70\u524D\u4F59\u989D\uFF1A\u3010").concat(shengbi, "\u3011\uFF0C\u8D2D\u4E70\u540E\u4F59\u989D\uFF1A\u3010").concat(shengbi - CommonMethods.buyNoDongtuUntilCost, "\u3011\uFF0C\u662F\u5426\u786E\u5B9A\uFF1F");
        var c = window.confirm(msg);
        if (!c)
            return;
        this.gameScene.sendMessageToServer(CommonMethods.BuyNoDongtuUntil_REQUEST, this.tractorPlayer.MyOwnId, "");
        this.resetGameRoomUI();
    };
    MainForm.prototype.blurChat = function () {
        if (!this.gameScene.ui.textAreaChatMsg)
            return;
        // this.gameScene.ui.textAreaChatMsg.value = "";
        this.gameScene.ui.textAreaChatMsg.blur();
    };
    MainForm.prototype.sendEmojiWithCheck = function (args) {
        var _this = this;
        if (this.isChatBanned(this.tractorPlayer.MyOwnId)) {
            alert("\u7981\u8A00\u751F\u6548\u4E2D\uFF0C\u8BF7\u5728\u89E3\u7981\u540E\u91CD\u8BD5\uFF0C\u89E3\u7981\u65E5\u671F\uFF1A".concat(this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId].noChatUntil));
            return;
        }
        var emojiType = args[0];
        if (emojiType < 0) {
            var chatQuota = 0;
            var shengbi = 0;
            if (this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId]) {
                chatQuota = parseInt(this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId].ChatQuota);
                shengbi = parseInt(this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId].Shengbi);
            }
            if (chatQuota + shengbi < CommonMethods.chatMessageCost) {
                alert("聊天卡/升币余额不足，无法发送消息");
                return;
            }
        }
        if (!this.isSendEmojiEnabled) {
            this.appendChatMsg(CommonMethods.emojiWarningMsg);
            return;
        }
        this.isSendEmojiEnabled = false;
        setTimeout(function () {
            _this.isSendEmojiEnabled = true;
        }, 1000 * CommonMethods.emojiWarningIntervalInSec);
        this.gameScene.sendMessageToServer(CommonMethods.SendEmoji_REQUEST, this.tractorPlayer.MyOwnId, JSON.stringify(args));
    };
    MainForm.prototype.IsSkinOwned = function (skinName) {
        var daojuInfoByPlayer = this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId];
        if (daojuInfoByPlayer) {
            var ownedSkinInfoList = daojuInfoByPlayer.ownedSkinInfo;
            return ownedSkinInfoList && ownedSkinInfoList.includes(skinName);
        }
        return false;
    };
    MainForm.prototype.IsSkinAfordableWithConfMsg = function (skinName) {
        var fullSkinInfo = this.gameScene.ui.fullSkinInfoResources;
        var daojuInfoByPlayer = this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId];
        if (fullSkinInfo && daojuInfoByPlayer.Shengbi >= fullSkinInfo[skinName].skinCost) {
            var msg = "";
            if (fullSkinInfo[skinName].skinCost > 0) {
                msg = "\u6B64\u6B21\u8D2D\u4E70\u5C06\u6D88\u8017\u5347\u5E01\u3010".concat(fullSkinInfo[skinName].skinCost, "\u3011\uFF0C\u8D2D\u4E70\u524D\u4F59\u989D\uFF1A\u3010").concat(daojuInfoByPlayer.Shengbi, "\u3011\uFF0C\u8D2D\u4E70\u540E\u4F59\u989D\uFF1A\u3010").concat(daojuInfoByPlayer.Shengbi - fullSkinInfo[skinName].skinCost, "\u3011\uFF0C\u662F\u5426\u786E\u5B9A\uFF1F");
            }
            return [true, msg];
        }
        return [false, ""];
    };
    MainForm.prototype.GetSkinType = function (skinName) {
        var fullSkinInfo = this.gameScene.ui.fullSkinInfoResources;
        if (fullSkinInfo) {
            var targetSkinInfo = fullSkinInfo[skinName];
            if (targetSkinInfo) {
                return targetSkinInfo.skinType;
            }
        }
        return 0;
    };
    MainForm.prototype.GetPlayerSex = function (playerID) {
        var daojuInfoByPlayer = this.DaojuInfo.daojuInfoByPlayer[playerID];
        if (daojuInfoByPlayer) {
            var skinInUse = daojuInfoByPlayer.skinInUse;
            var fullSkinInfo = this.gameScene.ui.fullSkinInfoResources;
            if (fullSkinInfo) {
                var targetSkinInfo = fullSkinInfo[skinInUse];
                if (targetSkinInfo) {
                    return targetSkinInfo.skinSex;
                }
            }
        }
        return "m";
    };
    MainForm.prototype.UpdateSkinInfoUI = function (preview) {
        var _this = this;
        var selectFullSkinInfo = document.getElementById("selectFullSkinInfo");
        if (!selectFullSkinInfo) return;
        
        var lblSkinType = document.getElementById("lblSkinType");
        var lblSkinCost = document.getElementById("lblSkinCost");
        var lblSkinOnwers = document.getElementById("lblSkinOnwers");
        var lblSkinIsOwned = document.getElementById("lblSkinIsOwned");
        var lblSkinSex = document.getElementById("lblSkinSex");
        var btnBuyOrUseSelectedSkin = document.getElementById("btnBuyOrUseSelectedSkin");
        var curSkinInfo;
        var fullSkinInfo = this.gameScene.ui.fullSkinInfoResources;

        var daojuInfoByPlayer = this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId];
        if (daojuInfoByPlayer) {
            if (fullSkinInfo) {
                // 核心修复：移除 options.length === 0 的限制，允许每次重建列表以同步“已拥有”状态
                var currentSelection = selectFullSkinInfo.value;
                selectFullSkinInfo.options.length = 0; 
                
                var ownedSkinInfoList_1 = daojuInfoByPlayer.ownedSkinInfo || [];
                
                // 1. 论坛头像：仅在“已拥有”时才注入 (由后端根据是否有 phpBB 头像判定)
                if (ownedSkinInfoList_1.includes("forum_avatar")) {
                    var optionForum = document.createElement("option");
                    optionForum.value = "forum_avatar";
                    optionForum.text = "论坛头像 - 【已拥有】";
                    selectFullSkinInfo.add(optionForum);
                }

                // 2. 按价格排序其他皮肤 (按价格)
                var sortedSkins = Object.entries(fullSkinInfo).sort(function (_a, _b) {
                    var a = _a[1], b = _b[1];
                    return a.skinCost - b.skinCost;
                });

                for (var i = 0; i < sortedSkins.length; i++) {
                    var key = sortedSkins[i][0], val = sortedSkins[i][1];
                    if (key === "forum_avatar" || key === "skin_questionmark") continue;
                    var option = document.createElement("option");
                    option.value = key;
                    var isOwned = ownedSkinInfoList_1.includes(key);
                    var priceText = isOwned ? "【已拥有】" : "\u4EF7\u683C\u3010".concat(val.skinCost, "\u3011\u5347\u5E01");
                    option.text = "".concat(val.skinDesc, " - ").concat(priceText);
                    selectFullSkinInfo.add(option);
                }
                
                // 恢复选中项 (增加 null 判定防御)
                if (currentSelection) {
                    selectFullSkinInfo.value = currentSelection;
                } else {
                    var curSkin = this.gameScene.skinInUse;
                    selectFullSkinInfo.value = (curSkin && curSkin.startsWith("URL:")) ? "forum_avatar" : (curSkin || "skin_basicmale");
                }

                if (selectFullSkinInfo.value === "forum_avatar") {
                    lblSkinSex.innerHTML = "未知";
                    lblSkinType.innerHTML = "静态";
                    lblSkinCost.innerHTML = "免费";
                    lblSkinOnwers.innerHTML = "您的论坛专属头像";
                    lblSkinIsOwned.innerHTML = "已经拥有";
                    btnBuyOrUseSelectedSkin.disabled = this.gameScene.skinInUse.startsWith("URL:");
                    btnBuyOrUseSelectedSkin.value = this.gameScene.skinInUse.startsWith("URL:") ? "正在使用中" : "启用此头像";
                }
                else {
                    curSkinInfo = fullSkinInfo[selectFullSkinInfo.value];
                    if (curSkinInfo) {
                        lblSkinSex.innerHTML = curSkinInfo.skinSex === "f" ? "女性" : "男性";
                        lblSkinType.innerHTML = curSkinInfo.skinType === 0 ? "静态" : "动态";
                        lblSkinCost.innerHTML = "\u3010\u5347\u5E01\u3011x".concat(curSkinInfo.skinCost);
                        var skinOwnersMsg = curSkinInfo.skinOwners > 0 ? "\u5DF2\u6709\u3010".concat(curSkinInfo.skinOwners, "\u3011\u4EBA\u62E5\u6709") : "尚未有人拥有";
                        lblSkinOnwers.innerHTML = skinOwnersMsg;
                        lblSkinIsOwned.innerHTML = "尚未拥有";
                        btnBuyOrUseSelectedSkin.disabled = false;
                        btnBuyOrUseSelectedSkin.value = "购买选定的皮肤";
                    }
                }
            }
            var ownedSkinInfoList = daojuInfoByPlayer.ownedSkinInfo || [];
            if (selectFullSkinInfo.value !== "forum_avatar" && ownedSkinInfoList.includes(selectFullSkinInfo.value)) {
                lblSkinIsOwned.innerHTML = "已经拥有";
                btnBuyOrUseSelectedSkin.disabled = (this.gameScene.skinInUse === selectFullSkinInfo.value);
                btnBuyOrUseSelectedSkin.value = (this.gameScene.skinInUse === selectFullSkinInfo.value) ? "正在使用中" : "启用选定的皮肤";
            }
        }
        if (preview) {
            // 皮肤预览 (已移除 3 秒自动恢复定时器，由 resetGameRoomUI 统一恢复)
            var isForum = selectFullSkinInfo.value === "forum_avatar";
            if (isForum || curSkinInfo) {
                if (isForum) {
                    var forumAvatarURL = daojuInfoByPlayer.forumAvatarURL;
                    if (forumAvatarURL && forumAvatarURL.startsWith("URL:")) {
                        this.SetAvatarImage(true, this.gameScene, 0, 0, forumAvatarURL, this.gameScene.ui.gameMe, this.gameScene.coordinates.cardHeight);
                    }
                } else {
                    var skinURL = "image/tractor/skin/".concat(curSkinInfo.skinName, ".").concat(curSkinInfo.skinType === 0 ? "webp" : "gif");
                    this.SetAvatarImage(true, this.gameScene, 0, curSkinInfo.skinType, skinURL, this.gameScene.ui.gameMe, this.gameScene.coordinates.cardHeight);
                }
            }
        }
    };
    MainForm.prototype.ReinitReplayEntities = function (that) {
        if (that.gameScene.isReplayMode) {
            that.InitReplayEntities();
        }
    };
    MainForm.prototype.btnPig_Click = function () {
        if (!this.gameScene.ui.btnPig || this.gameScene.ui.btnPig.classList.contains('hidden') || this.gameScene.ui.btnPig.classList.contains('disabled'))
            return;
        this.ToDiscard8Cards();
        this.ToShowCards();
    };
    MainForm.prototype.ToDiscard8Cards = function () {
        var _this = this;
        //判断是否处在扣牌阶段
        if (this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8Cards &&
            this.tractorPlayer.CurrentHandState.Last8Holder == this.tractorPlayer.PlayerId) //如果等我扣牌
         {
            if (this.SelectedCards.length == 8) {
                //扣牌,所以擦去小猪
                this.gameScene.ui.btnPig.hide();
                this.gameScene.ui.btnPig.classList.add('disabled');
                this.gameScene.ui.btnPig.classList.remove('pointerdiv');
                this.SelectedCards.forEach(function (card) {
                    _this.tractorPlayer.CurrentPoker.RemoveCard(card);
                });
                this.drawingFormHelper.removeCardImage(this.SelectedCards);
                this.gameScene.sendMessageToServer(StoreDiscardedCards_REQUEST, this.tractorPlayer.MyOwnId, JSON.stringify(this.SelectedCards));
                this.drawingFormHelper.ResortMyHandCards();
            }
        }
    };
    MainForm.prototype.ToShowCards = function () {
        var _this = this;
        if ((this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Playing || this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8CardsFinished) &&
            this.tractorPlayer.CurrentTrickState.NextPlayer() == this.tractorPlayer.PlayerId) {
            var selectedCardsValidationResult = TractorRules.IsValid(this.tractorPlayer.CurrentTrickState, this.SelectedCards, this.tractorPlayer.CurrentPoker);
            //如果我准备出的牌合法
            if (selectedCardsValidationResult.ResultType == ShowingCardsValidationResult.ShowingCardsValidationResultType.Valid) {
                //擦去小猪
                this.gameScene.ui.btnPig.hide();
                this.gameScene.ui.btnPig.classList.add('disabled');
                this.gameScene.ui.btnPig.classList.remove('pointerdiv');
                this.SelectedCards.forEach(function (card) {
                    _this.tractorPlayer.CurrentPoker.RemoveCard(card);
                });
                this.drawingFormHelper.removeCardImage(this.SelectedCards);
                this.ShowCards();
                this.drawingFormHelper.ResortMyHandCards();
                this.SelectedCards = [];
            }
            else if (selectedCardsValidationResult.ResultType == ShowingCardsValidationResult.ShowingCardsValidationResultType.TryToDump) {
                //擦去小猪
                this.gameScene.ui.btnPig.hide();
                this.gameScene.ui.btnPig.classList.add('disabled');
                this.gameScene.ui.btnPig.classList.remove('pointerdiv');
                this.gameScene.sendMessageToServer(ValidateDumpingCards_REQUEST, this.tractorPlayer.MyOwnId, JSON.stringify(this.SelectedCards));
            }
        }
    };
    MainForm.prototype.ShowCards = function () {
        if (this.tractorPlayer.CurrentTrickState.NextPlayer() == this.tractorPlayer.PlayerId) {
            this.tractorPlayer.CurrentTrickState.ShowedCards = CommonMethods.SetShowedCardsByPlayerID(this.tractorPlayer.CurrentTrickState.ShowedCards, this.tractorPlayer.PlayerId, CommonMethods.deepCopy(this.SelectedCards));
            this.gameScene.sendMessageToServer(PlayerShowCards_REQUEST, this.tractorPlayer.MyOwnId, JSON.stringify(this.tractorPlayer.CurrentTrickState));
        }
    };
    // handle failure
    MainForm.prototype.NotifyDumpingValidationResultEventHandler = function (result) {
        //擦掉上一把
        if (this.tractorPlayer.CurrentTrickState.AllPlayedShowedCards() || this.tractorPlayer.CurrentTrickState.IsStarted() == false) {
            this.drawingFormHelper.destroyAllShowedCards();
            this.drawingFormHelper.DrawScoreImageAndCards();
        }
        var latestPlayer = result.PlayerId;
        var position = this.PlayerPosition[latestPlayer];
        this.drawingFormHelper.DrawShowedCardsByPosition(result.CardsToShow, position);
    };
    // handle both
    MainForm.prototype.NotifyTryToDumpResultEventHandler = function (result) {
        var _this = this;
        if (result.ResultType == ShowingCardsValidationResult.ShowingCardsValidationResultType.DumpingSuccess || //甩牌成功.
            result.ResultType == ShowingCardsValidationResult.ShowingCardsValidationResultType.Valid) { //出牌成功.
            this.SelectedCards.forEach(function (card) {
                _this.tractorPlayer.CurrentPoker.RemoveCard(card);
            });
            this.drawingFormHelper.removeCardImage(this.SelectedCards);
            this.ShowCards();
            this.drawingFormHelper.ResortMyHandCards();
            this.SelectedCards = [];
        }
        else if (result.ResultType == ShowingCardsValidationResult.ShowingCardsValidationResultType.Invalid) {
            //出牌失败
            var msgs = [
                "\u51FA\u724C".concat(this.SelectedCards.length, "\u5F20\u5931\u8D25"),
            ];
            this.tractorPlayer.NotifyMessage(msgs);
            //暂时关闭托管功能，以免甩牌失败后立即点托管，会出别的牌
            this.gameScene.ui.btnRobot.hide();
            setTimeout(function () {
                result.MustShowCardsForDumpingFail.forEach(function (card) {
                    _this.tractorPlayer.CurrentPoker.RemoveCard(card);
                });
                _this.drawingFormHelper.removeCardImage(result.MustShowCardsForDumpingFail);
                _this.SelectedCards = CommonMethods.deepCopy(result.MustShowCardsForDumpingFail);
                _this.ShowCards();
                _this.drawingFormHelper.ResortMyHandCards();
                _this.SelectedCards = [];
                _this.gameScene.ui.btnRobot.show();
            }, 3000);
        }
        else {
            //甩牌失败
            var msgs = [
                "\u7529\u724C".concat(this.SelectedCards.length, "\u5F20\u5931\u8D25"),
                "\"\u7F5A\u5206\uFF1A".concat(this.SelectedCards.length * 10),
            ];
            this.tractorPlayer.NotifyMessage(msgs);
            //暂时关闭托管功能，以免甩牌失败后立即点托管，会出别的牌
            this.gameScene.ui.btnRobot.hide();
            setTimeout(function () {
                result.MustShowCardsForDumpingFail.forEach(function (card) {
                    _this.tractorPlayer.CurrentPoker.RemoveCard(card);
                });
                _this.drawingFormHelper.removeCardImage(result.MustShowCardsForDumpingFail);
                _this.SelectedCards = CommonMethods.deepCopy(result.MustShowCardsForDumpingFail);
                _this.ShowCards();
                _this.drawingFormHelper.ResortMyHandCards();
                _this.SelectedCards = [];
                _this.gameScene.ui.btnRobot.show();
            }, 3000);
        }
    };
    MainForm.prototype.NotifyStartTimerEventHandler = function (timerLength, playerID) {
        var _this = this;
        if (timerLength <= 0) {
            if (playerID) {
                this.UnwaitForPlayer(playerID);
            }
            else {
                this.ClearTimer();
            }
            return;
        }
        if (playerID) {
            this.WaitForPlayer(timerLength, playerID);
        }
        else {
            this.ClearTimer();
            this.gameScene.ui.timer.show();
            this.gameScene.game.countDown(timerLength, function () {
                _this.gameScene.ui.timer.hide();
            }, true);
        }
    };
    MainForm.prototype.ClearTimer = function () {
        if (this.gameScene._status && this.gameScene._status.countDown) {
            clearInterval(this.gameScene._status.countDown);
            delete this.gameScene._status.countDown;
            this.gameScene.ui.timer.hide();
            this.gameScene.game.timerCurrent = 0;
        }
    };
    //绘制当前轮各家所出的牌（仅用于切换视角，断线重连，恢复牌局，当前回合大牌变更时）
    MainForm.prototype.PlayerCurrentTrickShowedCards = function () {
        //擦掉出牌区
        this.drawingFormHelper.destroyAllShowedCards();
        this.drawingFormHelper.DrawScoreImageAndCards();
        this.tractorPlayer.destroyAllClientMessages();
        var cardsCount = 0;
        if (this.tractorPlayer.playerLocalCache.ShowedCardsInCurrentTrick != null) {
            for (var i = 0; i < this.tractorPlayer.playerLocalCache.ShowedCardsInCurrentTrick.length; i++) {
                var keyValue = this.tractorPlayer.playerLocalCache.ShowedCardsInCurrentTrick[i];
                var cards = keyValue.Cards;
                if (!cards || cards.length == 0)
                    continue;
                var player = keyValue.PlayerID;
                cardsCount = cards.length;
                var position = this.PlayerPosition[player];
                this.drawingFormHelper.DrawShowedCardsByPosition(cards, position);
            }
        }
        //重画亮过的牌
        if (this.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8Cards) {
            this.drawingFormHelper.TrumpMadeCardsShow();
        }
        //重画大牌标记
        if (this.tractorPlayer.playerLocalCache.WinnderID && cardsCount > 0) {
            this.drawingFormHelper.DrawOverridingFlag(cardsCount, this.PlayerPosition[this.tractorPlayer.playerLocalCache.WinnderID], this.tractorPlayer.playerLocalCache.WinResult - 1, false);
        }
    };
    MainForm.prototype.resetGameRoomUI = function (skipSkinRefresh) {
        this.blurChat();
        if (this.gameScene.ui.inputFormWrapper) {
            if (document.getElementById("btnBapi1")) {
                var cutPoint = 0;
                var cutInfo = "\u53D6\u6D88,".concat(cutPoint);
                this.CutCardShoeCardsCompleteEventHandler(cutPoint, cutInfo);
                return;
            }
            this.gameScene.ui.inputFormWrapper.remove();
            delete this.gameScene.ui.inputFormWrapper;
            
            // 核心修复：除非明确要求跳过（如刚点击购买），否则关闭菜单后恢复正式皮肤
            if (!skipSkinRefresh) {
                this.UpdateSkinStatus();
            }
        }
    };
    MainForm.prototype.ShowLastTrickAndTumpMade = function () {
        //擦掉上一把
        this.drawingFormHelper.destroyAllShowedCards();
        this.tractorPlayer.destroyAllClientMessages();
        //查看谁亮过什么牌
        //need to draw this first so that we have max count for trump made cards
        this.drawingFormHelper.TrumpMadeCardsShowFromLastTrick();
        //绘制上一轮各家所出的牌，缩小至一半，放在左下角，或者重画当前轮各家所出的牌
        this.PlayerLastTrickShowedCards();
        this.tractorPlayer.NotifyMessage(["回看上轮出牌及亮牌信息"]);
    };
    //绘制上一轮各家所出的牌，缩小一半
    MainForm.prototype.PlayerLastTrickShowedCards = function () {
        var lastLeader = this.tractorPlayer.CurrentTrickState.serverLocalCache.lastLeader;
        if (!lastLeader || !this.tractorPlayer.CurrentTrickState.serverLocalCache.lastShowedCards ||
            Object.keys(this.tractorPlayer.CurrentTrickState.serverLocalCache.lastShowedCards).length == 0)
            return;
        var trickState = new CurrentTrickState();
        trickState.Learder = lastLeader;
        trickState.Trump = this.tractorPlayer.CurrentTrickState.Trump;
        trickState.Rank = this.tractorPlayer.CurrentTrickState.Rank;
        var cardsCount = 0;
        for (var i = 0; i < this.tractorPlayer.CurrentTrickState.serverLocalCache.lastShowedCards.length; i++) {
            var keyValue = this.tractorPlayer.CurrentTrickState.serverLocalCache.lastShowedCards[i];
            trickState.ShowedCards = CommonMethods.SetShowedCardsByPlayerID(trickState.ShowedCards, keyValue.PlayerID, CommonMethods.deepCopy(keyValue.Cards));
        }
        for (var i = 0; i < trickState.ShowedCards.length; i++) {
            var keyValue = trickState.ShowedCards[i];
            var cards = keyValue.Cards;
            if (!cards || cards.length == 0)
                continue;
            var position = this.PlayerPosition[keyValue.PlayerID];
            cardsCount = cards.length;
            this.drawingFormHelper.DrawShowedCardsByPosition(cards, position);
        }
        var winnerID = TractorRules.GetWinner(trickState);
        var tempIsWinByTrump = this.IsWinningWithTrump(trickState, winnerID);
        this.drawingFormHelper.DrawOverridingFlag(cardsCount, this.PlayerPosition[winnerID], tempIsWinByTrump - 1, false);
    };
    MainForm.prototype.NotifyGameHallEventHandler = function (roomStateList, playerList, yuezhanList) {
        this.updateOnlineAndRoomPlayerList(roomStateList, playerList);
        if (playerList.includes(this.tractorPlayer.MyOwnId)) {
            this.tractorPlayer.destroyAllClientMessages();
            this.destroyGameRoom();
            this.destroyGameHall();
            this.drawGameHall(roomStateList, playerList, yuezhanList);
        }
    };
    MainForm.prototype.destroyGameHall = function () {
        if (this.gameScene.ui.frameGameHallTables) {
            this.gameScene.ui.frameGameHallTables.remove();
            delete this.gameScene.ui.frameGameHallTables;
        }
        if (this.gameScene.ui.frameGameHall) {
            this.gameScene.ui.frameGameHall.remove();
            delete this.gameScene.ui.frameGameHall;
        }
        if (this.gameScene.ui.yuezhanInterval) {
            var yziKeys = Object.getOwnPropertyNames(this.gameScene.ui.yuezhanInterval);
            for (var i = 0; i < yziKeys.length; i++) {
                clearInterval(this.gameScene.ui.yuezhanInterval[yziKeys[i]]);
            }
            delete this.gameScene.ui.yuezhanInterval;
        }
    };
    MainForm.prototype.drawFrameMain = function () {
        var frameMain = this.gameScene.ui.create.div('.frameMain', this.gameScene.ui.window);
        frameMain.style.position = 'absolute';
        frameMain.style.top = 'calc(50px)';
        frameMain.style.left = '0px';
        frameMain.style.bottom = '0px';
        frameMain.style.right = '0px';
        this.gameScene.ui.frameMain = frameMain;
        this.gameScene.ui.arena.setAttribute('data-number', 4);
        this.gameScene.ui.frameMain.appendChild(this.gameScene.ui.arena);
    };
    MainForm.prototype.drawFrameChat = function () {
        var _this = this;
        this.gameScene.ui.frameMain.style.right = '250px';
        var frameChat = this.gameScene.ui.create.div('.framechat', this.gameScene.ui.window);
        frameChat.style.width = '250px';
        frameChat.style.position = 'absolute';
        frameChat.style.top = 'calc(50px)';
        frameChat.style.bottom = 'calc(2%)';
        frameChat.style.right = '0px';
        frameChat.style['z-index'] = CommonMethods.zIndexFrameChat;
        this.gameScene.ui.frameChat = frameChat;
        if (this.gameScene.isReplayMode)
            return;
        var divOnlinePlayerList = this.gameScene.ui.create.div('.chatcomp.chatcompwithpadding.chattextdiv', frameChat);
        divOnlinePlayerList.style.top = 'calc(0%)';
        divOnlinePlayerList.style.height = 'calc(20% - 20px)';
        this.gameScene.ui.divOnlinePlayerList = divOnlinePlayerList;
        var divChatHistory = this.gameScene.ui.create.div('.chatcomp.chatcompwithpadding.chattextdiv', frameChat);
        divChatHistory.style.top = 'calc(20%)';
        divChatHistory.style.bottom = 'calc(90px)';
        this.gameScene.ui.divChatHistory = divChatHistory;
        var selectChatPresetMsgs = document.createElement("select");
        selectChatPresetMsgs.style.bottom = 'calc(50px)';
        selectChatPresetMsgs.style.height = 'calc(30px)';
        selectChatPresetMsgs.style.width = 'calc(100% - 55px)';
        selectChatPresetMsgs.classList.add('chatcomp', 'chatcompwithoutpadding', 'chatinput');
        frameChat.appendChild(selectChatPresetMsgs);
        this.gameScene.ui.selectPresetMsgs = selectChatPresetMsgs;
        for (var i = 0; i < CommonMethods.emojiMsgs.length; i++) {
            var option = document.createElement("option");
            option.value = CommonMethods.emojiMsgs[i];
            var shortCutKeyChar = String.fromCharCode(CommonMethods.emojiIndexToKeyCodes[i]);
            option.text = "".concat(shortCutKeyChar, "-").concat(CommonMethods.emojiMsgs[i]);
            selectChatPresetMsgs.appendChild(option);
        }

        // 核心扩展：为房主/管理员添加特殊指令
        var isOwner = this.tractorPlayer.CurrentRoomSetting && this.tractorPlayer.MyOwnId === this.tractorPlayer.CurrentRoomSetting.RoomOwner;
        if (isOwner && this.gameScene.isInGameRoom()) {
            var opt = document.createElement("option");
            opt.value = "命令：一键填满bot";
            opt.text = "★ 命令：一键填满bot";
            selectChatPresetMsgs.appendChild(opt);
        }
        if (this.tractorPlayer.isAdmin) {
            var adminOpt = document.createElement("option");
            adminOpt.value = "命令：刷新游戏设置";
            adminOpt.text = "★ 管理员：刷新游戏设置";
            selectChatPresetMsgs.appendChild(adminOpt);
        }

        selectChatPresetMsgs.addEventListener('change', function () {
            _this.selectPresetMsgsIsOpen = true;
            _this.handleSelectPresetMsgsClick(selectChatPresetMsgs);
        });
        var btnSendChat = this.gameScene.ui.create.div('.menubutton.highlight.pointerdiv', '发送', function () { return _this.sendPresetMsgs(selectChatPresetMsgs); });
        btnSendChat.style.bottom = 'calc(50px)';
        btnSendChat.style.height = 'calc(18px)';
        btnSendChat.style.width = 'calc(40px)';
        btnSendChat.style.right = 'calc(0px)';
        btnSendChat.style.paddingTop = '6px';
        btnSendChat.style.paddingBottom = '6px';
        btnSendChat.classList.add('chatcomp', 'chatcompwithoutpadding', 'chatinput');
        frameChat.appendChild(btnSendChat);
        this.gameScene.ui.btnSendChat = btnSendChat;
    };
    MainForm.prototype.drawGameRoom = function () {
        var _this = this;
        var frameGameRoom = this.gameScene.ui.create.div('.frameGameRoom', this.gameScene.ui.arena);
        frameGameRoom.style.position = 'absolute';
        frameGameRoom.style.top = '0px';
        frameGameRoom.style.left = '0px';
        frameGameRoom.style.bottom = '0px';
        frameGameRoom.style.right = '0px';
        this.gameScene.ui.frameGameRoom = frameGameRoom;
        if (this.gameScene.isReplayMode)
            return;
        if (!this.gameScene.ui.gameMe) {
            this.drawGameMe();
        }
        if (!this.gameScene.ui.handZone) {
            this.drawHandZone();
        }
        if (!this.gameScene.ui.gameRoomImagesChairOrPlayer) {
            this.gameScene.ui.gameRoomImagesChairOrPlayer = [];
        }
        // draw lblstarters
        this.gameScene.ui.pokerPlayerStartersLabel = [];
        for (var i = 0; i < 4; i++) {
            var lblStarter = this.gameScene.ui.create.div('.lblStarter', '', this.gameScene.ui.frameGameRoom);
            lblStarter.style.fontFamily = 'serif';
            lblStarter.style.fontSize = '20px';
            lblStarter.style.color = 'orange';
            lblStarter.style['font-weight'] = 'bold';
            lblStarter.style.textAlign = 'left';
            this.gameScene.ui.pokerPlayerStartersLabel.push(lblStarter);
            var obX = this.gameScene.coordinates.playerStarterPositions[i].x;
            var obY = this.gameScene.coordinates.playerStarterPositions[i].y;
            switch (i) {
                case 0:
                    lblStarter.style.left = "calc(".concat(obX, ")");
                    lblStarter.style.bottom = "calc(".concat(obY, ")");
                    break;
                case 1:
                    lblStarter.style.right = "calc(".concat(obX, ")");
                    lblStarter.style.bottom = "calc(".concat(obY, ")");
                    lblStarter.style.textAlign = 'right';
                    break;
                case 2:
                    lblStarter.style.right = "calc(".concat(obX, ")");
                    lblStarter.style.top = "calc(".concat(obY, ")");
                    break;
                case 3:
                    lblStarter.style.left = "calc(".concat(obX, ")");
                    lblStarter.style.bottom = "calc(".concat(obY, ")");
                    break;
                default:
                    break;
            }
        }
        // room name
        var roomNameString = "\u623F\u95F4\uFF1A".concat(this.tractorPlayer.CurrentRoomSetting.RoomName);
        var roomNameText = this.gameScene.ui.create.div('.roomNameText', roomNameString, this.gameScene.ui.frameGameRoom);
        roomNameText.style.fontFamily = 'serif';
        roomNameText.style.fontSize = '20px';
        roomNameText.style.color = 'orange';
        roomNameText.style.textAlign = 'left';
        roomNameText.style.left = "calc(0px)";
        roomNameText.style.top = "calc(0px)";
        this.gameScene.ui.roomNameText = roomNameText;
        // room owner
        var roomOwnerString = "\u623F\u4E3B\uFF1A".concat(this.gameScene.hidePlayerID ? "" : this.tractorPlayer.CurrentRoomSetting.RoomOwner);
        var roomOwnerText = this.gameScene.ui.create.div('.roomOwnerText', roomOwnerString, this.gameScene.ui.frameGameRoom);
        roomOwnerText.style.fontFamily = 'serif';
        roomOwnerText.style.fontSize = '20px';
        roomOwnerText.style.color = 'orange';
        roomOwnerText.style.textAlign = 'left';
        roomOwnerText.style.left = "calc(0px)";
        roomOwnerText.style.top = "calc(30px)";
        this.gameScene.ui.roomOwnerText = roomOwnerText;
        // btnPig
        var btnPig = this.gameScene.ui.create.div('.menubutton.highlight.large', '确定', function () { return _this.btnPig_Click(); });
        btnPig.style.width = 'calc(60px)';
        btnPig.style.height = 'calc(30px)';
        btnPig.style.position = 'absolute';
        btnPig.style.right = "calc(".concat(this.gameScene.coordinates.cardWidth, "px)");
        btnPig.style.bottom = "calc(".concat(this.gameScene.coordinates.showedCardsPositions[0].y, ")");
        btnPig.style.fontFamily = 'serif';
        btnPig.style.fontSize = '20px';
        btnPig.classList.add('disabled');
        btnPig.classList.remove('pointerdiv');
        btnPig.hide();
        this.gameScene.ui.frameGameRoom.appendChild(btnPig);
        this.gameScene.ui.btnPig = btnPig;
        var btnWid = "18%";
        // btnReady
        if (!this.gameScene.ui.btnReady) {
            var btnReady = this.gameScene.ui.create.div('.menubutton.highlight.large', '开始', function () { return _this.btnReady_Click(); });
            this.gameScene.ui.btnReady = btnReady;
            this.gameScene.ui.frameChat.appendChild(btnReady);
            btnReady.style.position = 'absolute';
            btnReady.style.width = "calc(".concat(btnWid, ")");
            btnReady.style.left = "calc(26%)";
            btnReady.style.transition = "0s";
            btnReady.style.bottom = "0px";
            btnReady.style.fontFamily = 'serif';
            btnReady.style.fontSize = '20px';
        }
        // btnQiangliang
        if (!this.gameScene.ui.btnQiangliang) {
            var btnQiangliang = this.gameScene.ui.create.div('.menubutton.highlight.large.pointerdiv', '抢亮', function () { return _this.btnQiangliang_Click(); });
            this.gameScene.ui.btnQiangliang = btnQiangliang;
            this.gameScene.ui.frameChat.appendChild(btnQiangliang);
            btnQiangliang.style.position = 'absolute';
            btnQiangliang.style.width = "calc(".concat(btnWid, ")");
            btnQiangliang.style.right = "calc(26%)";
            btnQiangliang.style.transition = "0s";
            btnQiangliang.style.bottom = "0px";
            btnQiangliang.style.fontFamily = 'serif';
            btnQiangliang.style.fontSize = '20px';
        }
        // btnRobot
        if (!this.gameScene.ui.btnRobot) {
            var btnRobot = this.gameScene.ui.create.div('.menubutton.highlight.large.pointerdiv', '托管', function () { return _this.btnRobot_Click(); });
            this.gameScene.ui.btnRobot = btnRobot;
            this.gameScene.ui.frameChat.appendChild(btnRobot);
            btnRobot.style.position = 'absolute';
            btnRobot.style.width = "calc(".concat(btnWid, ")");
            btnRobot.style.left = '0px';
            btnRobot.style.transition = "0s";
            btnRobot.style.bottom = "0px";
            btnRobot.style.fontFamily = 'serif';
            btnRobot.style.fontSize = '20px';
        }
        // btnShowLastTrick
        if (!this.gameScene.ui.btnShowLastTrick) {
            var btnShowLastTrick = this.gameScene.ui.create.div('.menubutton.highlight.large.pointerdiv', '上轮', function () { return _this.HandleRightClickEmptyArea(); });
            this.gameScene.ui.btnShowLastTrick = btnShowLastTrick;
            this.gameScene.ui.frameChat.appendChild(btnShowLastTrick);
            btnShowLastTrick.style.position = 'absolute';
            btnShowLastTrick.style.width = "calc(".concat(btnWid, ")");
            btnShowLastTrick.style.right = '0px';
            btnShowLastTrick.style.transition = "0s";
            btnShowLastTrick.style.bottom = "0px";
            btnShowLastTrick.style.fontFamily = 'serif';
            btnShowLastTrick.style.fontSize = '20px';
        }
        this.gameScene.ui.btnRobot.hide();
        this.gameScene.ui.btnReady.hide();
        this.gameScene.ui.btnQiangliang.hide();
        this.gameScene.ui.btnShowLastTrick.hide();
    };
    MainForm.prototype.drawGameHall = function (roomStateList, playerList, yuezhanList) {
        var _this = this;
        if (!this.gameScene.ui.gameMe) {
            this.drawGameMe();
        }
        this.UpdateQiandaoStatus();
        var frameGameHall = this.gameScene.ui.create.div('.frameGameHall', this.gameScene.ui.frameMain);
        frameGameHall.style.position = 'absolute';
        frameGameHall.style.top = '0px';
        frameGameHall.style.left = '0px';
        frameGameHall.style.bottom = '0px';
        frameGameHall.style.right = '0px';
        this.gameScene.ui.frameGameHall = frameGameHall;
        var frameGameHallOnlinersHeader = this.gameScene.ui.create.div('.frameGameHallOnliners', this.gameScene.ui.frameGameHall);
        frameGameHallOnlinersHeader.style.position = 'absolute';
        frameGameHallOnlinersHeader.style.paddingTop = '20px';
        frameGameHallOnlinersHeader.style.top = '0px';
        frameGameHallOnlinersHeader.style.left = '0px';
        frameGameHallOnlinersHeader.style.width = '15%';
        frameGameHallOnlinersHeader.style.paddingLeft = '10px';
        frameGameHallOnlinersHeader.style.overflow = 'visible';
        frameGameHallOnlinersHeader.style.zIndex = CommonMethods.zIndexFrameGameHallOnliners;
        this.gameScene.ui.frameGameHallOnlinersHeader = frameGameHallOnlinersHeader;
        var frameGameHallOnliners = this.gameScene.ui.create.div('.frameGameHallOnliners', this.gameScene.ui.frameGameHall);
        frameGameHallOnliners.style.position = 'absolute';
        frameGameHallOnliners.style.top = '140px';
        frameGameHallOnliners.style.left = '0px';
        frameGameHallOnliners.style.bottom = '0px';
        frameGameHallOnliners.style.width = '15%';
        frameGameHallOnliners.style.paddingLeft = '10px';
        frameGameHallOnliners.style.overflow = 'auto';
        this.gameScene.ui.frameGameHallOnliners = frameGameHallOnliners;
        /*
        var pYuezhanHeader = document.createElement("p");
        pYuezhanHeader.innerText = "\u7EA6\u6218(".concat(yuezhanList.length, ")");
        pYuezhanHeader.style.marginTop = '0px';
        pYuezhanHeader.style.fontFamily = 'xinwei';
        pYuezhanHeader.style.fontSize = '30px';
        pYuezhanHeader.style.textAlign = 'left';
        pYuezhanHeader.style.whiteSpace = 'nowrap';
        this.gameScene.ui.frameGameHallOnlinersHeader.appendChild(pYuezhanHeader);
         */
        var playerListAll = CommonMethods.deepCopy(playerList);
        var frameGameHallTables = this.gameScene.ui.create.div('.frameGameHallTables', this.gameScene.ui.frameGameHall);
        frameGameHallTables.style.position = 'absolute';
        frameGameHallTables.style.top = '0px';
        frameGameHallTables.style.left = '15%';
        frameGameHallTables.style.bottom = '0px';
        frameGameHallTables.style.right = '0px';
        this.gameScene.ui.frameGameHallTables = frameGameHallTables;
        var _loop_2 = function (i) {
            var leftOffset = 28 + 44 * (i % 2);
            var topOffset = 30 + 40 * Math.floor(i / 2);
            pokerTable = this_2.gameScene.ui.create.div('.pokerTable', this_2.gameScene.ui.frameGameHallTables);
            pokerTable.setBackgroundImage('image/tractor/btn/poker_table.png');
            pokerTable.setAttribute('data-position', i);
            pokerTable.style.left = "calc(".concat(leftOffset, "% - 80px)");
            pokerTable.style.top = "calc(".concat(topOffset, "% - 80px)");
            pokerTable.style.width = '160px';
            pokerTable.style.height = '160px';
            pokerTable.style['background-size'] = '100% 100%';
            pokerTable.style['background-repeat'] = 'no-repeat';
            var noSignalStr = roomStateList[i].roomSetting.IsGameCasual == 0 ? "<br/>严肃活泼局" : "<br/>休闲娱乐局";
            var pokerTableName = this_2.gameScene.ui.create.div('', "".concat(i + 1, "\u53F7\u623F\u95F4").concat(noSignalStr), this_2.gameScene.ui.frameGameHallTables);
            pokerTableName.style.fontFamily = 'serif';
            pokerTableName.style.fontSize = '18px';
            pokerTableName.style.width = '160px';
            pokerTableName.style.height = '160px';
            pokerTableName.style.left = "calc(".concat(leftOffset, "% - 80px)");
            pokerTableName.style.top = "calc(".concat(topOffset, "% - 80px)");
            pokerTableName.style.textAlign = 'center';
            pokerTableName.style.cursor = 'pointer';
            // click
            pokerTableName.addEventListener("click", function (e) {
                _this.destroyGameHall();
                _this.gameScene.sendMessageToServer(PLAYER_ENTER_ROOM_REQUEST, _this.tractorPlayer.MyOwnId, JSON.stringify({
                    roomID: i,
                    posID: -1,
                }));
            });
            // mouseover
            pokerTableName.addEventListener("mouseover", function (e) {
                e.target.style.top = "calc(".concat(topOffset, "% - 85px)");
                e.target.previousSibling.style.top = "calc(".concat(topOffset, "% - 85px)");
            });
            // mouseout
            pokerTableName.addEventListener("mouseout", function (e) {
                e.target.style.top = "calc(".concat(topOffset, "% - 80px)");
                e.target.previousSibling.style.top = "calc(".concat(topOffset, "% - 80px)");
            });
            var _loop_4 = function (j) {
                var leftOffsetChair = "calc(".concat(leftOffset, "% - 40px)");
                var topOffsetChair = "calc(".concat(topOffset, "% - 40px)");
                var topOffsetChairLifted = "calc(".concat(topOffset, "% - 45px)");
                switch (j) {
                    case 0:
                        topOffsetChair = "calc(".concat(topOffset, "% - 160px)");
                        topOffsetChairLifted = "calc(".concat(topOffset, "% - 165px)");
                        break;
                    case 1:
                        leftOffsetChair = "calc(".concat(leftOffset, "% - 170px)");
                        break;
                    case 2:
                        topOffsetChair = "calc(".concat(topOffset, "% + 40px)");
                        topOffsetChairLifted = "calc(".concat(topOffset, "% + 35px)");
                        break;
                    case 3:
                        leftOffsetChair = "calc(".concat(leftOffset, "% + 90px)");
                        break;
                    default:
                        break;
                }
                if (roomStateList[i].CurrentGameState.Players[j] != null) {
                    var p_1 = roomStateList[i].CurrentGameState.Players[j];
                    var pid = p_1.PlayerId;
                    
                    if (pid) {
                        playerListAll.push(pid);

                        // 1. 使用标准组件创建玩家 (初始隐藏，防止大框残影闪烁)
                        var localPlayerUI = this_2.CreatePlayer(j, pid, this_2.gameScene.ui.frameGameHallTables);
                        localPlayerUI.style.visibility = "hidden"; 
                        localPlayerUI.style.left = leftOffsetChair;
                        localPlayerUI.style.top = topOffsetChair;
                        localPlayerUI.style.zIndex = CommonMethods.zIndexPlayer;

                        // 2. 获取皮肤
                        var skinInUse = this_2.DaojuInfo.daojuInfoByPlayer[pid] ? this_2.DaojuInfo.daojuInfoByPlayer[pid].skinInUse : CommonMethods.defaultSkinInUse;
                        var skinType = this_2.GetSkinType(skinInUse);
                        var skinURL = skinInUse.startsWith("URL:") ? skinInUse : "image/tractor/skin/".concat(skinInUse, ".").concat(skinType === 0 ? "webp" : "gif");
                        
                        // 3. 核心对齐：在算出宽高并定位完成后，再显示头像
                        this_2.SetAvatarImage(false, this_2.gameScene, j, skinType, skinURL, localPlayerUI, 80, function(p, pos, gs, w, h) {
                            var dx = (80 - w) / 2;
                            var dy = (80 - h) / 2;
                            var finalTop = "calc(".concat(topOffsetChair, " + ").concat(dy, "px)");
                            var liftedTop = "calc(".concat(topOffsetChairLifted, " + ").concat(dy, "px)");
                            
                            localPlayerUI.style.left = "calc(".concat(leftOffsetChair, " + ").concat(dx, "px)");
                            localPlayerUI.style.top = finalTop;
                            localPlayerUI.style.cursor = "pointer";
                            // 居中定位已完成，现在揭开面纱
                            localPlayerUI.style.visibility = "visible";

                            // 增加 Hover 动效
                            localPlayerUI.addEventListener("mouseover", function () {
                                localPlayerUI.style.top = liftedTop;
                            });
                            localPlayerUI.addEventListener("mouseout", function () {
                                localPlayerUI.style.top = finalTop;
                            });
                        }, p_1);
                    } else {
                        // 核心增强：如果是空位带观察者，画椅子
                        pokerChair = this_2.gameScene.ui.create.div('.pokerChair', this_2.gameScene.ui.frameGameHallTables);
                        pokerChair.setBackgroundImage('image/tractor/btn/poker_chair.png');
                        pokerChair.style.left = leftOffsetChair;
                        pokerChair.style.top = topOffsetChair;
                        pokerChair.style.width = '80px';
                        pokerChair.style.height = '80px';
                        pokerChair.style['background-size'] = '100% 100%';
                        pokerChair.style['background-repeat'] = 'no-repeat';
                        pokerChair.style.cursor = 'pointer';
                        
                        // 增加交互
                        pokerChair.addEventListener("click", function (e) {
                            _this.destroyGameHall();
                            _this.gameScene.sendMessageToServer(PLAYER_ENTER_ROOM_REQUEST, _this.tractorPlayer.MyOwnId, JSON.stringify({
                                roomID: i,
                                posID: j,
                            }));
                        });
                        pokerChair.addEventListener("mouseover", function (e) {
                            e.target.style.top = topOffsetChairLifted;
                        });
                        pokerChair.addEventListener("mouseout", function (e) {
                            e.target.style.top = topOffsetChair;
                        });
                    }

                    obCount = p_1.Observers.length;
                    if (obCount > 0) {
                        for (var k = 0; k < roomStateList[i].CurrentGameState.Players[j].Observers.length; k++) {
                            obY = "calc(".concat(topOffset, "% - 40px + ").concat((k + 1) * obTopOffset, "px)");
                            switch (j) {
                                case 0:
                                    obY = "calc(".concat(topOffset, "% - 120px - ").concat((obCount - (k + 1)) * obTopOffset, "px)");
                                    break;
                                case 2:
                                    obY = "calc(".concat(topOffset, "% + 40px + ").concat((k + 1) * obTopOffset, "px)");
                                    break;
                                default:
                                    break;
                            }
                            var oid = roomStateList[i].CurrentGameState.Players[j].Observers[k];
                            playerListAll.push(oid);
                            pokerPlayerOb = this_2.gameScene.ui.create.div('.pokerPlayerObGameHall', "\u3010".concat(oid, "\u3011"), this_2.gameScene.ui.frameGameHallTables);
                            pokerPlayerOb.style.fontFamily = 'serif';
                            pokerPlayerOb.style.fontSize = '20px';
                            pokerPlayerOb.style.left = leftOffsetChair;
                            pokerPlayerOb.style.top = obY;
                            if (j !== 3)
                                pokerPlayerOb.style.width = '160px';
                            pokerPlayerOb.style.textAlign = 'center';
                            if (j === 1) {
                                pokerPlayerOb.style.textAlign = 'right';
                            }
                            else if (j === 3) {
                                pokerPlayerOb.style.textAlign = 'left';
                            }
                        }
                    }
                }
                else {
                    pokerChair = this_2.gameScene.ui.create.div('.pokerChair', this_2.gameScene.ui.frameGameHallTables);
                    pokerChair.setBackgroundImage('image/tractor/btn/poker_chair.png');
                    pokerChair.setAttribute('data-position', i * 4 + j);
                    pokerChair.style.left = leftOffsetChair;
                    pokerChair.style.top = topOffsetChair;
                    pokerChair.style.width = '80px';
                    pokerChair.style.height = '80px';
                    pokerChair.style['background-size'] = '100% 100%';
                    pokerChair.style['background-repeat'] = 'no-repeat';
                    var pokerChairName = this_2.gameScene.ui.create.div('.pokerChairName', "".concat(j + 1), this_2.gameScene.ui.frameGameHallTables);
                    pokerChairName.style.fontFamily = 'cursive';
                    pokerChairName.style.fontSize = '20px';
                    pokerChairName.style.color = 'yellow';
                    pokerChairName.style.width = '80px';
                    pokerChairName.style.height = '80px';
                    pokerChairName.style.left = leftOffsetChair;
                    pokerChairName.style.top = topOffsetChair;
                    pokerChairName.style.textAlign = 'center';
                    pokerChairName.style['line-height'] = '70px';
                    pokerChairName.style.cursor = 'pointer';
                    // click
                    pokerChairName.addEventListener("click", function (e) {
                        _this.destroyGameHall();
                        _this.gameScene.sendMessageToServer(PLAYER_ENTER_ROOM_REQUEST, _this.gameScene.playerName, JSON.stringify({
                            roomID: i,
                            posID: j,
                        }));
                    });
                    // mouseover
                    pokerChairName.addEventListener("mouseover", function (e) {
                        e.target.style.top = topOffsetChairLifted;
                        e.target.previousSibling.style.top = topOffsetChairLifted;
                    });
                    // mouseout
                    pokerChairName.addEventListener("mouseout", function (e) {
                        e.target.style.top = topOffsetChair;
                        e.target.previousSibling.style.top = topOffsetChair;
                    });
                }
            };
            for (var j = 0; j < 4; j++) {
                _loop_4(j);
            }
        };
        var this_2 = this, pokerTable, obCount, obTopOffset = 20, pokerPlayer, obY, pokerPlayerOb, pokerChair;
        for (var i = 0; i < roomStateList.length; i++) {
            _loop_2(i);
        }
        /*
        var IOwnYuezhan = false;
        for (var i = 0; i < yuezhanList.length; i++) {
            var yuezhanInfo = yuezhanList[i];
            if (yuezhanInfo.owner === this.tractorPlayer.MyOwnId) {
                IOwnYuezhan = true;
            }
        }
        if (!IOwnYuezhan) {
            // pick a date time
            var inputDueDate = document.createElement("input");
            inputDueDate.style.position = 'static';
            inputDueDate.style.display = 'block';
            inputDueDate.setAttribute("type", "datetime-local");
            inputDueDate.setAttribute("id", "inputDueDatePicker");
            this.gameScene.ui.frameGameHallOnlinersHeader.appendChild(inputDueDate);
            var btnCreateYuezhan = this.gameScene.ui.create.div('.menubutton.highlight.pointerdiv', "我要约战", function () {
                var inputDueDate = document.getElementById("inputDueDatePicker");
                var dateTimeValue = inputDueDate.value;
                if (!dateTimeValue) {
                    alert("约战时间不能为空");
                    return;
                }
                var yzDueDate = new Date(dateTimeValue);
                if (yzDueDate < new Date()) {
                    alert("请选择未来作为约战时间");
                    return;
                }
                var yzDueDateISO = CommonMethods.DateToISO8601(yzDueDate);
                var yze = new YuezhanEntity();
                yze.owner = _this.tractorPlayer.MyOwnId;
                yze.dueDate = yzDueDateISO;
                yze.participants.push(_this.tractorPlayer.MyOwnId);
                _this.joinOrQuitYuezhan(yze);
            });
            btnCreateYuezhan.style.marginTop = '10px';
            btnCreateYuezhan.style.position = 'static';
            btnCreateYuezhan.style.display = 'block';
            btnCreateYuezhan.style.width = '80px';
            this.gameScene.ui.frameGameHallOnlinersHeader.appendChild(btnCreateYuezhan);
        }
        else {
            this.gameScene.ui.frameGameHallOnliners.style.top = '50px';
        }
        var _loop_3 = function (i) {
            var yuezhanInfo = yuezhanList[i];
            var now = new Date();
            if (new Date(yuezhanInfo.dueDate) < now) {
                return "continue";
            }
            var divTitle = document.createElement("div");
            divTitle.style.marginTop = '20px';
            divTitle.style.position = 'static';
            divTitle.style.display = 'block';
            divTitle.style.fontSize = '20px';
            divTitle.innerText = "\u3010".concat(yuezhanInfo.owner, "\u3011\u7684\u7EA6\u6218");
            this_3.gameScene.ui.frameGameHallOnliners.appendChild(divTitle);
            var divDueDate = document.createElement("div");
            divDueDate.style.position = 'static';
            divDueDate.style.display = 'block';
            var yzDueDate = new Date(yuezhanInfo.dueDate);
            divDueDate.innerText = "".concat(CommonMethods.DateToISO8601(yzDueDate));
            this_3.gameScene.ui.frameGameHallOnliners.appendChild(divDueDate);
            var divCountdown = document.createElement("div");
            divCountdown.style.position = 'static';
            divCountdown.style.display = 'block';
            divCountdown.innerText = CommonMethods.zeroDuration;
            this_3.gameScene.ui.frameGameHallOnliners.appendChild(divCountdown);
            if (!this_3.gameScene.ui.yuezhanInterval) {
                this_3.gameScene.ui.yuezhanInterval = {};
            }
            this_3.gameScene.ui.yuezhanInterval[yuezhanInfo.owner] = setInterval(function (that, yzinfo, divcd) {
                // Get the current date and time
                // Calculate the remaining time
                var nowForYuezhan = new Date();
                var distance = new Date(yzinfo.dueDate).getTime() - nowForYuezhan.getTime();
                // Calculate days, hours, minutes, and seconds
                var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);
                // Display the countdown in the div
                divcd.innerText = "".concat(days > 0 ? days + "天，" : "").concat(hours > 0 ? CommonMethods.Pad(hours) : "00", ":").concat(minutes > 0 ? CommonMethods.Pad(minutes) : "00", ":").concat(seconds > 0 ? CommonMethods.Pad(seconds) : "00");
                if (distance < 0) {
                    clearInterval(that.gameScene.ui.yuezhanInterval[yzinfo.owner]);
                    delete that.gameScene.ui.yuezhanInterval[yzinfo.owner];
                }
            }, 1000, this_3, yuezhanInfo, divCountdown);
            var divParticipantsHeader = document.createElement("div");
            divParticipantsHeader.style.position = 'static';
            divParticipantsHeader.style.display = 'block';
            divParticipantsHeader.innerText = "参战玩家：";
            this_3.gameScene.ui.frameGameHallOnliners.appendChild(divParticipantsHeader);
            var isMeParticipant = false;
            for (var i_1 = 0; i_1 < yuezhanInfo.participants.length; i_1++) {
                var parID = yuezhanInfo.participants[i_1];
                if (parID === this_3.tractorPlayer.MyOwnId) {
                    isMeParticipant = true;
                }
                var d = document.createElement("div");
                d.style.position = 'static';
                d.style.display = 'block';
                d.innerText = "\u3010".concat(parID, "\u3011");
                this_3.gameScene.ui.frameGameHallOnliners.appendChild(d);
            }
            var yze = new YuezhanEntity();
            yze.owner = yuezhanInfo.owner;
            var btnJoinOrQuitYuezhan = this_3.gameScene.ui.create.div('.menubutton.highlight.pointerdiv', "".concat(isMeParticipant ? "退战" : "参战"), function () { return _this.joinOrQuitYuezhan(yze); });
            btnJoinOrQuitYuezhan.style.marginTop = '10px';
            btnJoinOrQuitYuezhan.style.position = 'static';
            btnJoinOrQuitYuezhan.style.display = 'block';
            btnJoinOrQuitYuezhan.style.width = '40px';
            this_3.gameScene.ui.frameGameHallOnliners.appendChild(btnJoinOrQuitYuezhan);
        };
        var this_3 = this;
        for (var i = 0; i < yuezhanList.length; i++) {
            _loop_3(i);
        }
        */
    };
    MainForm.prototype.joinOrQuitYuezhan = function (yuezhanEntity) {
        this.gameScene.sendMessageToServer(CommonMethods.SendJoinOrQuitYuezhan_REQUEST, this.tractorPlayer.MyOwnId, JSON.stringify(yuezhanEntity));
    };
    MainForm.prototype.drawGameMe = function () {
        this.gameScene.ui.gameMe = this.CreatePlayer(0, this.tractorPlayer.PlayerId, this.gameScene.ui.arena); // creates ui.gameMe
        this.gameScene.ui.gameMe.style.zIndex = CommonMethods.zIndexGameMe;
        if (!this.tractorPlayer.isObserver) {
            var skinInUseMe = this.gameScene.skinInUse;
            var skinTypeMe = this.GetSkinType(skinInUseMe);
            var skinURL = "";
            if (skinInUseMe.startsWith("URL:")) {
                skinURL = skinInUseMe;
            } else {
                var skinExtentionMe = skinTypeMe === 0 ? "webp" : "gif";
                skinURL = "image/tractor/skin/".concat(skinInUseMe, ".").concat(skinExtentionMe);
            }
            this.SetAvatarImage(false, this.gameScene, 0, skinTypeMe, skinURL, this.gameScene.ui.gameMe, this.gameScene.coordinates.cardHeight);
        }
    };
    MainForm.prototype.drawHandZone = function () {
        this.gameScene.ui.create.me(); // creates ui.me, which is hand zone
        this.gameScene.ui.handZone = this.gameScene.ui.me;
        this.gameScene.ui.handZone.innerHTML = '';
        this.gameScene.ui.handZone.style.position = "absolute";
        this.gameScene.ui.handZone.style.left = "calc(".concat(this.gameScene.ui.gameMe.clientWidth, "px)");
        // this.gameScene.ui.handZone.style.left will be re-adjusted via callback of drawGameMe
        this.gameScene.ui.handZone.style.right = "calc(0px)";
        this.gameScene.ui.handZone.style.width = "auto";
    };
    MainForm.prototype.CreatePlayer = function (pos, playerId, parentNode) {
        var playerDiv = this.gameScene.ui.create.player(parentNode);
        playerDiv.setAttribute('data-position', pos);
        // 彻底禁用动画，防止头像“从左侧飞入”
        playerDiv.style.transition = "none";
        playerDiv.node.avatar.style['background-size'] = '100% 100%';
        playerDiv.node.avatar.style['background-repeat'] = 'no-repeat';
        playerDiv.node.avatar.show();
        playerDiv.node.nameol.innerHTML = this.gameScene.hidePlayerID ? "" : playerId;
        // 核心增强：统一全游戏的玩家 ID 样式 (底部对齐 + 描边阴影)
        playerDiv.node.nameol.style.color = "white";
        playerDiv.node.nameol.style.textShadow = "1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black";
        playerDiv.node.nameol.style.bottom = "0px";
        playerDiv.node.nameol.style.position = "absolute";
        playerDiv.node.nameol.style.width = "100%";
        playerDiv.node.nameol.style.textAlign = "center";
        playerDiv.node.nameol.style.pointerEvents = "none";
        return playerDiv;
    };
    MainForm.prototype.EnableShortcutKeys = function () {
        var _this = this;
        if (this.gameScene.isReplayMode) {
            window.addEventListener("keyup", function (e) {
                var keyCode = e.keyCode;
                switch (keyCode) {
                    case 38:
                        _this.btnFirstTrick_Click();
                        return;
                    case 37:
                        _this.btnPreviousTrick_Click();
                        return;
                    case 39:
                        _this.btnNextTrick_Click();
                        return;
                    case 40:
                        _this.btnLastTrick_Click();
                        return;
                    case 96:
                        _this.btnFirstPersonView_Click();
                        return;
                    default:
                        break;
                }
            });
        }
        window.addEventListener("mouseup", function (e) {
            // 右键点空白区
            if (_this.gameScene.isInGameRoom()) {
                if (e.button === 2 && e.target.classList.contains('frameGameRoom')) {
                    _this.HandleRightClickEmptyArea();
                    return;
                }
            }
            // 左键点空白区
            if (e.button === 0 &&
                (e.target.classList.contains('replayFormWrapper') ||
                    e.target.classList.contains('frameGameRoom') ||
                    e.target.classList.contains('frameGameHallOnliners') ||
                    e.target.classList.contains('frameGameHallTables') ||
                    e.target.classList.contains('inputFormWrapper') ||
                    e.target.classList.contains('chattextdiv') ||
                    e.target.classList.contains('hand-zone') ||
                    e.target.parentElement.classList.contains('chattextdiv'))) {
                _this.resetGameRoomUI();
                return;
            }
        });
        window.addEventListener('keyup', function (e) {
            var keyCode = e.keyCode;
            if (keyCode === 27) {
                _this.resetGameRoomUI();
                return;
            }
            if (_this.gameScene.isReplayMode)
                return;
            if (e.target === _this.gameScene.ui.textAreaChatMsg) {
                if (keyCode === 13) {
                    _this.emojiSubmitEventhandler();
                }
                return;
            }
            if (_this.gameScene.ui.inputFormWrapper)
                return;
            // 1 - 9: 49 - 57
            var keyCodeString = "".concat(keyCode);
            if (CommonMethods.emojiKeyCodeToIndex.hasOwnProperty(keyCodeString)) {
                var prevSelection = _this.gameScene.ui.selectPresetMsgs.selectedIndex;
                var emojiType = CommonMethods.emojiKeyCodeToIndex[keyCodeString];
                if (emojiType !== prevSelection) {
                    _this.gameScene.ui.selectPresetMsgs.selectedIndex = emojiType;
                }
                var emojiIndex = CommonMethods.GetRandomInt(CommonMethods.winEmojiLength);
                var msgString = CommonMethods.emojiMsgs[emojiType];
                var args = [emojiType, emojiIndex, msgString];
                _this.sendEmojiWithCheck(args);
            }
            if (_this.gameScene.isInGameRoom()) {
                switch (keyCode) {
                    case 90:
                        if (_this.tractorPlayer.isObserver)
                            return;
                        _this.btnReady_Click();
                        return;
                    case 83:
                        if (_this.tractorPlayer.isObserver)
                            return;
                        _this.btnPig_Click();
                        return;
                    case 82:
                        if (_this.tractorPlayer.isObserver)
                            return;
                        _this.btnRobot_Click();
                        return;
                    case 81:
                        if (_this.tractorPlayer.isObserver)
                            return;
                        _this.btnQiangliang_Click();
                        return;
                    default:
                        break;
                }
            }
        });
    };
    MainForm.prototype.UpdateQiandaoStatus = function () {
        if (this.gameScene.ui.btnQiandao) {
            if (this.IsQiandaoRenewed()) {
                this.gameScene.ui.btnQiandao.innerHTML = "签到领福利";
                this.gameScene.ui.btnQiandao.show();
            }
            else {
                this.gameScene.ui.btnQiandao.innerHTML = "今日已签到";
                this.gameScene.ui.btnQiandao.hide();
            }
        }
    };
    MainForm.prototype.IsQiandaoRenewed = function () {
        var daojuInfoByPlayer = this.DaojuInfo.daojuInfoByPlayer[this.tractorPlayer.MyOwnId];
        return daojuInfoByPlayer && daojuInfoByPlayer.isRenewed;
    };
    MainForm.prototype.SetAvatarImage = function (isPreview, gs, pos, skinType, skinURL, playerObj, fixedHeight, callback, p) {
        var isExternal = skinURL.startsWith("URL:") || skinURL.includes("http");
        var actualURL = isExternal ? (skinURL.startsWith("URL:") ? skinURL.substring(4) : skinURL) : skinURL;
        
        var img = new Image();
        img.onload = function (e) {
            var wid = e.target.width;
            var hei = e.target.height;
            var ratio = wid / hei;
            
            var finalWid, finalHei;
            if (ratio > 1) { // 横向
                finalWid = fixedHeight;
                finalHei = fixedHeight / ratio;
            } else { // 纵向
                finalHei = fixedHeight;
                finalWid = fixedHeight * ratio;
            }

            playerObj.style.width = "".concat(finalWid, "px");
            playerObj.style.height = "".concat(finalHei, "px");
            
            playerObj.node.avatar.style.backgroundColor = "transparent";
            if (isExternal) {
                // 直接操作 style 绕过框架补全，彻底修复“一开始加载不出图片”的问题
                playerObj.node.avatar.style.backgroundImage = "url('".concat(actualURL, "')");
                playerObj.node.avatar.style.backgroundSize = "contain";
                playerObj.node.avatar.style.backgroundPosition = "center";
            } else {
                playerObj.node.avatar.setBackgroundImage(actualURL);
                playerObj.node.avatar.style.backgroundSize = "100% 100%";
            }

            if (gs && gs.ui.handZone && playerObj === gs.ui.gameMe) {
                gs.ui.handZone.style.left = "calc(".concat(playerObj.clientWidth, "px)");
            }
            if (callback) {
                callback(p, pos, gs, finalWid, finalHei);
            }
        };
        if (isExternal) {
            img.src = actualURL;
            return;
        }
        var skinPath = "image/tractor/skin/";
        var skinKey = skinURL.substring(skinPath.length);
        if (gs.ui.avatarResources[skinKey]) {
            img.src = gs.ui.avatarResources[skinKey];
        }
        else {
            img.src = skinURL;
        }
    };
    MainForm.prototype.UpdateSkinStatus = function () {
        if (this.gameScene.isInGameHall()) {
            var myId = this.tractorPlayer.MyOwnId;
            var daojuInfoByPlayer = this.DaojuInfo.daojuInfoByPlayer[myId];
            if (!daojuInfoByPlayer) return;

            // 1. 获取服务器记录的正式皮肤
            var skinInUse = daojuInfoByPlayer.skinInUse || CommonMethods.defaultSkinInUse;
            var skinType = this.GetSkinType(skinInUse);
            var skinURL = "";
            if (skinInUse.startsWith("URL:")) {
                skinURL = skinInUse;
            } else {
                var skinExtention = skinType === 0 ? "webp" : "gif";
                skinURL = "image/tractor/skin/".concat(skinInUse, ".").concat(skinExtention);
            }

            // 2. 复原大厅主视角头像
            if (this.gameScene.ui.gameMe) {
                this.SetAvatarImage(false, this.gameScene, 0, skinType, skinURL, this.gameScene.ui.gameMe, this.gameScene.coordinates.cardHeight);
            }
        }

        // 核心修复：如果在房间里，直接复用全场重绘逻辑
        // 这样能确保视角锁定、空位椅子渲染、观察者列表全部按照最新 GameState 完美还原，解决视角跳转和问号头像问题
        if (this.gameScene.isInGameRoom()) {
            this.NewPlayerJoined(true, false);
        }
    };
    MainForm.prototype.NotifyEmojiEventHandler = function (playerID, emojiType, emojiIndex, isCenter, msgString, noSpeaker) {
        var isPlayerInGameHall = this.gameScene.isInGameHall();
        if (0 <= emojiType && emojiType < CommonMethods.animatedEmojiTypeLength && Object.keys(this.PlayerPosition).includes(playerID)) {
            msgString = CommonMethods.emojiMsgs[emojiType];
            if (!isPlayerInGameHall) {
                this.drawingFormHelper.DrawEmojiByPosition(this.PlayerPosition[playerID], emojiType, emojiIndex, isCenter);
            }
        }
        if (isCenter)
            return;
        var finalMsg = "";
        // if (!isPlayerInGameHall && this.sgDrawingHelper.hiddenEffects[msgString]) {
        //     if (this.isInHiddenGames()) {
        //         finalMsg = `【${playerID}】发动了隐藏技：【${msgString}】，因为游戏中已屏蔽`;
        //     } else {
        //         this.sgDrawingHelper.hiddenEffects[msgString].apply(this.sgDrawingHelper);
        //         finalMsg = `【${playerID}】发动了隐藏技：【${msgString}】`;
        //     }
        // } else if (!isPlayerInGameHall && this.sgDrawingHelper.hiddenGames[msgString]) {
        //     if (this.isInHiddenGames()) {
        //         finalMsg = `【${playerID}】发动了隐藏技：【${msgString}】，因为游戏中已屏蔽`;
        //     } else {
        //         finalMsg = `【${playerID}】发动了隐藏技：【${msgString}】`;
        //         if (this.tractorPlayer.MyOwnId === playerID) this.sgDrawingHelper.hiddenGames[msgString].apply(this.sgDrawingHelper, [true, playerID]);
        //     }
        // } else {
        var prefix = CommonMethods.systemMsgPrefix;
        if (playerID && !noSpeaker) {
            prefix = "\u3010".concat(playerID, "\u3011\u8BF4\uFF1A");
        }
        finalMsg = "".concat(prefix).concat(msgString);
        // }
        this.drawingFormHelper.DrawDanmu(finalMsg);
        this.appendChatMsg(finalMsg);
    };
    //     public isInHiddenGames(): boolean {
    //         return this.sgDrawingHelper.hiddenGamesImages &&
    //             this.sgDrawingHelper.hiddenGamesImages.length > 0 &&
    //             this.sgDrawingHelper.hiddenGamesImages[0].visible
    //     }
    MainForm.prototype.appendChatMsg = function (finalMsg) {
        var p = document.createElement("p");
        p.innerText = finalMsg;
        this.gameScene.ui.divChatHistory.appendChild(p);
        this.gameScene.ui.divChatHistory.scrollTop = this.gameScene.ui.divChatHistory.scrollHeight;
    };
    MainForm.prototype.updateOnlineAndRoomPlayerList = function (roomStateList, playersInGameHall) {
        // gather players with status
        var playersInGameRoomPlaying = {};
        var playersInGameRoomObserving = {};
        var playerIsOffline = {};
        for (var i = 0; i < roomStateList.length; i++) {
            var rs = roomStateList[i];
            var roomName = rs.roomSetting.RoomName;
            for (var j = 0; j < 4; j++) {
                if (rs.CurrentGameState.Players[j] != null) {
                    var player = rs.CurrentGameState.Players[j];
                    if (!playersInGameRoomPlaying[roomName]) {
                        playersInGameRoomPlaying[roomName] = [];
                    }
                    if (!playersInGameRoomObserving[roomName]) {
                        playersInGameRoomObserving[roomName] = [];
                    }
                    playersInGameRoomPlaying[roomName].push(player.PlayerId);
                    if (player.IsOffline) {
                        playerIsOffline[player.PlayerId] = true;
                    }
                    if (player.Observers && player.Observers.length > 0) {
                        playersInGameRoomObserving[roomName] = playersInGameRoomObserving[roomName].concat(player.Observers);
                    }
                }
            }
        }
        this.gameScene.ui.divOnlinePlayerList.innerHTML = '';
        // players in game hall
        if (playersInGameHall && playersInGameHall.length > 0) {
            playersInGameHall.sort();
            var headerGameHall = document.createElement("p");
            headerGameHall.innerText = "大厅";
            headerGameHall.style.fontWeight = 'bold';
            this.gameScene.ui.divOnlinePlayerList.appendChild(headerGameHall);
            for (var i = 0; i < playersInGameHall.length; i++) {
                var d = document.createElement("div");
                d.style.position = 'static';
                d.style.display = 'block';
                var pid = playersInGameHall[i];
                var noChat = this.isChatBanned(pid) ? "-禁言中" : "";
                var pInfo = this.DaojuInfo && this.DaojuInfo.daojuInfoByPlayer && this.DaojuInfo.daojuInfoByPlayer[pid];
                var clientVersion = (pInfo && pInfo.clientType === CommonMethods.PLAYER_CLIENT_TYPE_shengjiweb) ? "-怀旧版" : "";
                var pidInfo = "".concat(pid).concat(noChat).concat(clientVersion);
                var pRank = pInfo ? pInfo.Rank : "初出江湖";
                d.innerText = "\u3010".concat(pidInfo, "\u3011\u7B49\u7EA7\uFF1A").concat(pRank);
                this.gameScene.ui.divOnlinePlayerList.appendChild(d);
            }
        }
        // players in game room playing or observing
        for (var _i = 0, _a = Object.entries(playersInGameRoomPlaying); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            var players = value;
            players.sort();
            var obs = playersInGameRoomObserving[key];
            obs.sort();
            var headerGameRoomPlaying = document.createElement("p");
            headerGameRoomPlaying.innerText = "\u623F\u95F4\u3010".concat(key, "\u3011\u684C\u4E0A");
            headerGameRoomPlaying.style.fontWeight = 'bold';
            this.gameScene.ui.divOnlinePlayerList.appendChild(headerGameRoomPlaying);
            for (var i = 0; i < players.length; i++) {
                var d = document.createElement("div");
                d.style.position = 'static';
                d.style.display = 'block';
                var pid = players[i];
                var noChat = this.isChatBanned(pid) ? "-禁言中" : "";
                var pInfo = this.DaojuInfo && this.DaojuInfo.daojuInfoByPlayer && this.DaojuInfo.daojuInfoByPlayer[pid];
                var clientVersion = (pInfo && pInfo.clientType === CommonMethods.PLAYER_CLIENT_TYPE_shengjiweb) ? "-怀旧版" : "";
                var isOfflineInfo = (pid in playerIsOffline) ? "-离线中" : "";
                var pidInfo = "".concat(pid).concat(noChat).concat(clientVersion).concat(isOfflineInfo);
                var pRank = pInfo ? pInfo.Rank : "初出茅庐";
                d.innerText = "\u3010".concat(pidInfo, "\u3011\u7B49\u7EA7\uFF1A").concat(pRank);
                this.gameScene.ui.divOnlinePlayerList.appendChild(d);
            }
            if (obs && obs.length > 0) {
                var headerGameRoomObserving = document.createElement("p");
                headerGameRoomObserving.innerText = "\u623F\u95F4\u3010".concat(key, "\u3011\u6811\u4E0A");
                headerGameRoomObserving.style.fontWeight = 'bold';
                this.gameScene.ui.divOnlinePlayerList.appendChild(headerGameRoomObserving);
                for (var i = 0; i < obs.length; i++) {
                    var d = document.createElement("div");
                    d.style.position = 'static';
                    d.style.display = 'block';
                    var pid = obs[i];
                    var noChat = this.isChatBanned(pid) ? "-禁言中" : "";
                    var pInfo = this.DaojuInfo && this.DaojuInfo.daojuInfoByPlayer && this.DaojuInfo.daojuInfoByPlayer[pid];
                    var clientVersion = (pInfo && pInfo.clientType === CommonMethods.PLAYER_CLIENT_TYPE_shengjiweb) ? "-怀旧版" : "";
                    var pidInfo = "".concat(pid).concat(noChat).concat(clientVersion);
                    var pRank = pInfo ? pInfo.Rank : "初出茅庐";
                    d.innerText = "\u3010".concat(pidInfo, "\u3011\u7B49\u7EA7\uFF1A").concat(pRank);
                    this.gameScene.ui.divOnlinePlayerList.appendChild(d);
                }
            }
        }
        this.gameScene.ui.divOnlinePlayerList.scrollTop = this.gameScene.ui.divOnlinePlayerList.scrollHeight;
    };
    MainForm.prototype.NotifyOnlinePlayerListEventHandler = function (playerID, isJoining) {
        var isJoingingStr = isJoining ? "加入" : "退出";
        var chatMsg = "\u3010".concat(playerID, "\u3011").concat(isJoingingStr, "\u4E86\u6E38\u620F");
        this.appendChatMsg(chatMsg);
        if (isJoining && this.shouldSoundEnter(playerID, true))
            this.gameScene.playAudio(CommonMethods.audioEnterHall);
    };
    MainForm.prototype.NotifyGameRoomPlayerListEventHandler = function (playerID, isJoining, roomName) {
        if (!roomName)
            return;
        var isJoingingStr = isJoining ? "加入" : "退出";
        var chatMsg = "\u3010".concat(playerID, "\u3011").concat(isJoingingStr, "\u4E86\u623F\u95F4\u3010").concat(roomName, "\u3011");
        this.appendChatMsg(chatMsg);
        if (isJoining && this.shouldSoundEnter(playerID, false))
            this.gameScene.playAudio(CommonMethods.audioEnterRoom, CommonMethods.GetPlayerCount(this.tractorPlayer.CurrentGameState.Players));
    };
    MainForm.prototype.shouldSoundEnter = function (playerID, isJoiningGameHall) {
        // 如果我在大厅，别人加入大厅
        if (this.gameScene.isInGameHall() && isJoiningGameHall && playerID !== this.tractorPlayer.PlayerId)
            return true;
        // 如果我在房间里、游戏尚未开始
        var players = this.tractorPlayer.CurrentGameState.Players;
        if (this.gameScene.isInGameRoom() &&
            this.tractorPlayer.CurrentHandState.CurrentHandStep <= SuitEnums.HandStep.BeforeDistributingCards &&
            // 有人加入大厅 或者 有人加入我所在的房间
            (isJoiningGameHall || CommonMethods.GetPlayerByID(players, playerID))) {
            return true;
        }
        return false;
    };
    MainForm.prototype.CutCardShoeCardsEventHandler = function () {
        var _this = this;
        var cutInfo = "";
        var cutPoint = -1;
        if (this.IsDebug || this.gameScene.ui.inputFormWrapper || this.gameScene.noCutCards.toLowerCase() === "true") {
            cutPoint = 0;
            cutInfo = "\u53D6\u6D88,".concat(cutPoint);
            this.CutCardShoeCardsCompleteEventHandler(cutPoint, cutInfo);
            return;
        }
        var inputFormWrapper = this.gameScene.ui.create.div('.inputFormWrapper', this.gameScene.ui.frameMain);
        inputFormWrapper.id = "inputFormWrapper";
        inputFormWrapper.style.position = 'absolute';
        inputFormWrapper.style.width = 'calc(100%)';
        inputFormWrapper.style.height = 'calc(100%)';
        inputFormWrapper.style.color = 'black';
        inputFormWrapper.style.textShadow = 'none';
        inputFormWrapper.style.zIndex = CommonMethods.zIndexSettingsForm;
        this.gameScene.ui.inputFormWrapper = inputFormWrapper;
        jQuery(inputFormWrapper).load("game/tractor/src/text/cutcards_form.htm", function (response, status, xhr) { _this.renderCutCardsForm(response, status, xhr, _this.gameScene); });
    };
    MainForm.prototype.renderCutCardsForm = function (response, status, xhr, gs) {
        var _this = this;
        var cutInfo = "";
        var cutPoint = -1;
        var btnRandom = document.getElementById("btnRandom");
        // fix bug: 其它操作导致切牌对话框被终止，则视为取消切牌
        if (!btnRandom) {
            var cutPoint_1 = 0;
            var cutInfo_1 = "\u53D6\u6D88,".concat(cutPoint_1);
            this.CutCardShoeCardsCompleteEventHandler(cutPoint_1, cutInfo_1);
            return;
        }
        btnRandom.onclick = function () {
            cutPoint = CommonMethods.GetRandomInt(107) + 1;
            cutInfo = "".concat(btnRandom.value, ",").concat(cutPoint);
            _this.CutCardShoeCardsCompleteEventHandler(cutPoint, cutInfo);
        };
        var btnCancel = document.getElementById("btnCancel");
        btnCancel.onclick = function () {
            cutPoint = 0;
            cutInfo = "".concat(btnCancel.value, ",").concat(cutPoint);
            _this.CutCardShoeCardsCompleteEventHandler(cutPoint, cutInfo);
        };
        var btnBapi1 = document.getElementById("btnBapi1");
        btnBapi1.onclick = function () {
            cutPoint = 1;
            cutInfo = "".concat(btnBapi1.value, ",").concat(cutPoint);
            _this.CutCardShoeCardsCompleteEventHandler(cutPoint, cutInfo);
        };
        var btnBapi3 = document.getElementById("btnBapi3");
        btnBapi3.onclick = function () {
            cutPoint = 3;
            cutInfo = "".concat(btnBapi3.value, ",").concat(cutPoint);
            _this.CutCardShoeCardsCompleteEventHandler(cutPoint, cutInfo);
        };
        var btnManual = document.getElementById("btnManual");
        btnManual.onclick = function () {
            var txtManual = document.getElementById("txtManual");
            var cutPointStr = txtManual.value;
            if (CommonMethods.IsNumber(cutPointStr)) {
                cutPoint = parseInt(cutPointStr);
            }
            cutInfo = "".concat(btnManual.value, ",").concat(cutPoint);
            _this.CutCardShoeCardsCompleteEventHandler(cutPoint, cutInfo);
        };
    };
    MainForm.prototype.CutCardShoeCardsCompleteEventHandler = function (cutPoint, cutInfo) {
        if (cutPoint < 0 || cutPoint > 108) {
            alert("请输入0-108之间的数字");
        }
        else {
            this.gameScene.sendMessageToServer(CommonMethods.PlayerHasCutCards_REQUEST, this.tractorPlayer.MyOwnId, cutInfo);
            if (this.gameScene.ui.inputFormWrapper) {
                this.gameScene.ui.inputFormWrapper.remove();
                delete this.gameScene.ui.inputFormWrapper;
            }
        }
    };
    MainForm.prototype.DoReplayMainForm = function () {
        var _this = this;
        var replayFormWrapper = this.gameScene.ui.create.div('.replayFormWrapper', this.gameScene.ui.frameChat);
        replayFormWrapper.id = "replayFormWrapper";
        replayFormWrapper.style.position = 'relative';
        replayFormWrapper.style.display = 'block';
        replayFormWrapper.style.color = 'black';
        replayFormWrapper.style.textShadow = 'none';
        replayFormWrapper.style.textAlign = 'center';
        replayFormWrapper.style.height = '100%';
        this.gameScene.ui.replayFormWrapper = replayFormWrapper;
        jQuery(replayFormWrapper).load("game/tractor/src/text/replay_form.htm", function (response, status, xhr) { _this.renderReplayMainForm(response, status, xhr, _this.gameScene); });
    };
    MainForm.prototype.renderReplayMainForm = function (response, status, xhr, gs) {
        var _this = this;
        this.selectDates = document.getElementById("selectDates");
        this.selectTimes = document.getElementById("selectTimes");
        var btnLoadReplay = document.getElementById("btnLoadReplay");
        this.selectDates.onchange = function () {
            _this.onDatesSelectChange(true, 0);
        };
        if (!this.gameScene.ui.gameRoomImagesChairOrPlayer) {
            this.gameScene.ui.gameRoomImagesChairOrPlayer = [];
        }
        if (!this.gameScene.ui.pokerPlayerStartersLabel) {
            this.gameScene.ui.pokerPlayerStartersLabel = [];
            for (var i = 0; i < 4; i++) {
                var lblStarter = this.gameScene.ui.create.div('.lblStarter', "", this.gameScene.ui.frameGameRoom);
                lblStarter.style.fontFamily = 'serif';
                lblStarter.style.fontSize = '20px';
                lblStarter.style.color = 'orange';
                lblStarter.style['font-weight'] = 'bold';
                lblStarter.style.textAlign = 'left';
                this.gameScene.ui.pokerPlayerStartersLabel.push(lblStarter);
                var obX = this.gameScene.coordinates.playerStarterPositions[i].x;
                var obY = this.gameScene.coordinates.playerStarterPositions[i].y;
                switch (i) {
                    case 0:
                        lblStarter.style.left = "calc(".concat(obX, ")");
                        lblStarter.style.bottom = "calc(".concat(obY, ")");
                        break;
                    case 1:
                        lblStarter.style.right = "calc(".concat(obX, ")");
                        lblStarter.style.bottom = "calc(".concat(obY, ")");
                        lblStarter.style.textAlign = 'right';
                        break;
                    case 2:
                        lblStarter.style.right = "calc(".concat(obX, ")");
                        lblStarter.style.top = "calc(".concat(obY, ")");
                        break;
                    case 3:
                        lblStarter.style.left = "calc(".concat(obX, ")");
                        lblStarter.style.bottom = "calc(".concat(obY, ")");
                        break;
                    default:
                        break;
                }
            }
        }
        this.InitReplayEntities();
        btnLoadReplay.onclick = function () {
            if (_this.selectTimes.selectedIndex < 0)
                return;
            _this.loadReplayEntity(_this.currentReplayEntities[1][_this.selectTimes.selectedIndex], true);
            // btnFirstPersonView
            if (!_this.btnFirstPersonView)
                _this.btnFirstPersonView = _this.gameScene.ui.create.div('.menubutton.highlight.pointerdiv.replayButtonsClass.replayButtonsClass5', '第一视角', _this.gameScene.ui.replayFormWrapper, function () { return _this.btnFirstPersonView_Click(); });
            // btnFirstTrick
            if (!_this.btnFirstTrick)
                _this.btnFirstTrick = _this.gameScene.ui.create.div('.menubutton.highlight.pointerdiv.replayButtonsClass.replayButtonsClass4', '第一轮', _this.gameScene.ui.replayFormWrapper, function () { return _this.btnFirstTrick_Click(); });
            // btnPreviousTrick
            if (!_this.btnPreviousTrick)
                _this.btnPreviousTrick = _this.gameScene.ui.create.div('.menubutton.highlight.pointerdiv.replayButtonsClass.replayButtonsClass3', '上一轮', _this.gameScene.ui.replayFormWrapper, function () { return _this.btnPreviousTrick_Click(); });
            // btnNextTrick
            if (!_this.btnNextTrick)
                _this.btnNextTrick = _this.gameScene.ui.create.div('.menubutton.highlight.pointerdiv.replayButtonsClass.replayButtonsClass2', '下一轮', _this.gameScene.ui.replayFormWrapper, function () { return _this.btnNextTrick_Click(); });
            // btnLastTrick
            if (!_this.btnLastTrick)
                _this.btnLastTrick = _this.gameScene.ui.create.div('.menubutton.highlight.pointerdiv.replayButtonsClass.replayButtonsClass1', '最末轮', _this.gameScene.ui.replayFormWrapper, function () { return _this.btnLastTrick_Click(); });
        };
    };
    MainForm.prototype.InitReplayEntities = function () {
        var _this = this;
        this.removeOptions(this.selectDates);
        IDBHelper.ReadReplayEntityAll(function (dtList) {
            var dates = [];
            for (var i = 0; i < dtList.length; i++) {
                var dt = dtList[i];
                var datetimes = dt.split(IDBHelper.replaySeparator);
                var dateString = datetimes[0];
                if (!dates.includes(dateString)) {
                    dates.push(dateString);
                    var option = document.createElement("option");
                    option.text = dateString;
                    _this.selectDates.add(option);
                }
            }
            _this.selectDates.selectedIndex = _this.selectDates.options.length - 1;
            _this.onDatesSelectChange(true, 0);
        });
    };
    MainForm.prototype.loadReplayEntity = function (re, shouldDraw) {
        this.tractorPlayer.replayEntity.CloneFrom(re);
        var nullCTS = new CurrentTrickState();
        nullCTS.Rank = -1;
        this.tractorPlayer.replayEntity.CurrentTrickStates.push(nullCTS); // use null to indicate end of tricks, so that to show ending scores
        this.tractorPlayer.replayedTricks = [];
        this.tractorPlayer.replayEntity.Players = CommonMethods.RotateArray(this.tractorPlayer.replayEntity.Players, this.tractorPlayer.replayAngle);
        if (this.tractorPlayer.replayEntity.PlayerRanks != null) {
            this.tractorPlayer.replayEntity.PlayerRanks = CommonMethods.RotateArray(this.tractorPlayer.replayEntity.PlayerRanks, this.tractorPlayer.replayAngle);
        }
        this.StartReplay(shouldDraw);
    };
    MainForm.prototype.StartReplay = function (shouldDraw) {
        var _this = this;
        this.drawingFormHelper.resetReplay();
        this.drawingFormHelper.destroyLast8Cards();
        var players = this.tractorPlayer.replayEntity.Players;
        var playerRanks = new Array(4);
        if (this.tractorPlayer.replayEntity.PlayerRanks != null) {
            playerRanks = this.tractorPlayer.replayEntity.PlayerRanks;
        }
        else {
            var tempRank = this.tractorPlayer.replayEntity.CurrentHandState.Rank;
            playerRanks = [tempRank, tempRank, tempRank, tempRank];
        }
        this.destroyImagesChairOrPlayer();
        var _loop_5 = function (i) {
            var starterText = players[i] === this_4.tractorPlayer.replayEntity.CurrentHandState.Starter ? "庄家" : "".concat(i + 1);
            this_4.gameScene.ui.pokerPlayerStartersLabel[i].innerHTML = starterText;
            var playerUI = this_4.CreatePlayer(i, players[i], this_4.gameScene.ui.frameGameRoom);
            this_4.gameScene.ui.gameRoomImagesChairOrPlayer[i] = playerUI;
            if (i === 0) {
                this_4.gameScene.ui.gameMe = playerUI;
                if (!this_4.gameScene.ui.handZone) {
                    this_4.drawHandZone();
                }
                return "continue";
            }
            // 切换视角
            playerUI.style.cursor = 'pointer';
            // click
            playerUI.addEventListener("click", function (e) {
                var pos = i + 1;
                _this.replayAngleByPosition(pos);
            });
            // mouseover
            playerUI.addEventListener("mouseover", function (e) {
                var targetUI = jQuery(e.target).closest('.player')[0];
                var pos = parseInt(targetUI.getAttribute('data-position'));
                if (pos === 2)
                    targetUI.style.top = "calc(".concat(_this.gameScene.coordinates.playerSkinPositions[i].y, " - 5px)");
                else
                    targetUI.style.bottom = "calc(".concat(_this.gameScene.coordinates.playerSkinPositions[i].y, " + 5px)");
            });
            // mouseout
            playerUI.addEventListener("mouseout", function (e) {
                var targetUI = jQuery(e.target).closest('.player')[0];
                var pos = parseInt(targetUI.getAttribute('data-position'));
                if (pos === 2)
                    targetUI.style.top = "calc(".concat(_this.gameScene.coordinates.playerSkinPositions[i].y, ")");
                else
                    targetUI.style.bottom = "calc(".concat(_this.gameScene.coordinates.playerSkinPositions[i].y, ")");
            });
        };
        var this_4 = this;
        for (var i = 0; i < 4; i++) {
            _loop_5(i);
        }
        this.tractorPlayer.PlayerId = players[0];
        this.tractorPlayer.CurrentGameState = new GameState();
        for (var i = 0; i < 4; i++) {
            var temp = new PlayerEntity();
            temp.PlayerId = players[i];
            temp.Rank = playerRanks[i];
            temp.Team = (i % 2) + 1;
            this.tractorPlayer.CurrentGameState.Players[i] = temp;
        }
        //set player position
        this.PlayerPosition = {};
        this.PositionPlayer = {};
        var nextPlayer = players[0];
        var postion = 1;
        this.PlayerPosition[nextPlayer] = postion;
        this.PositionPlayer[postion] = nextPlayer;
        nextPlayer = CommonMethods.GetNextPlayerAfterThePlayer(this.tractorPlayer.CurrentGameState.Players, nextPlayer).PlayerId;
        while (nextPlayer != players[0]) {
            postion++;
            this.PlayerPosition[nextPlayer] = postion;
            this.PositionPlayer[postion] = nextPlayer;
            nextPlayer = CommonMethods.GetNextPlayerAfterThePlayer(this.tractorPlayer.CurrentGameState.Players, nextPlayer).PlayerId;
        }
        this.tractorPlayer.CurrentHandState = new CurrentHandState();
        this.tractorPlayer.CurrentHandState.CloneFrom(this.tractorPlayer.replayEntity.CurrentHandState);
        for (var _i = 0, _a = Object.entries(this.tractorPlayer.CurrentHandState.PlayerHoldingCards); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            var tempcp = new CurrentPoker();
            tempcp.CloneFrom(value);
            this.tractorPlayer.CurrentHandState.PlayerHoldingCards[key] = tempcp;
            this.tractorPlayer.replayEntity.CurrentHandState.PlayerHoldingCards[key] = tempcp;
        }
        this.tractorPlayer.CurrentHandState.Score = 0;
        this.tractorPlayer.CurrentHandState.ScoreCards = [];
        this.tractorPlayer.CurrentPoker = this.tractorPlayer.replayEntity.CurrentHandState.PlayerHoldingCards[players[0]];
        this.drawingFormHelper.DrawSidebarFull();
        if (this.shouldShowLast8Cards())
            this.drawingFormHelper.DrawDiscardedCards();
        if (shouldDraw) {
            this.drawAllPlayerHandCards();
            this.drawingFormHelper.TrumpMadeCardsShowFromLastTrick();
        }
    };
    MainForm.prototype.drawAllPlayerHandCards = function () {
        if (this.gameScene.yesFirstPersonView === "true") {
            this.drawingFormHelper.DrawHandCardsByPosition(1, this.tractorPlayer.replayEntity.CurrentHandState.PlayerHoldingCards[this.PositionPlayer[1]], 1);
        }
        else {
            for (var i = 1; i <= 4; i++) {
                this.drawingFormHelper.DrawHandCardsByPosition(i, this.tractorPlayer.replayEntity.CurrentHandState.PlayerHoldingCards[this.PositionPlayer[i]], i == 1 ? 1 : this.gameScene.coordinates.replayHandCardScale);
            }
        }
    };
    MainForm.prototype.replayNextTrick = function () {
        var _this = this;
        if (this.tractorPlayer.replayEntity.CurrentTrickStates.length == 0) {
            return;
        }
        var isOnePlayerAtATime = this.onePlayerAtATime && this.onePlayerAtATime.curIndex < this.onePlayerAtATime.cardsListList.length || this.gameScene.yesFirstPersonView === "true" && this.tractorPlayer.replayEntity.CurrentTrickStates.length > 2;
        var isOnePlayerAtATimeInit = isOnePlayerAtATime && (!this.onePlayerAtATime || this.onePlayerAtATime.curIndex >= this.onePlayerAtATime.cardsListList.length);
        if (isOnePlayerAtATimeInit) {
            this.onePlayerAtATime = new OnePlayerAtATime(this.drawingFormHelper);
        }
        var trick;
        var isNormalShowCards = true;
        if (!isOnePlayerAtATime || isOnePlayerAtATimeInit) {
            trick = this.tractorPlayer.replayEntity.CurrentTrickStates[0];
            this.tractorPlayer.replayEntity.CurrentTrickStates.shift();
            this.tractorPlayer.replayedTricks.push(trick);
            if (trick.Rank < 0) {
                // 已出完所有牌，结束画面
                this.tractorPlayer.CurrentHandState.ScoreCards = CommonMethods.deepCopy(this.tractorPlayer.replayEntity.CurrentHandState.ScoreCards);
                this.tractorPlayer.CurrentHandState.Score = this.tractorPlayer.replayEntity.CurrentHandState.Score;
                this.drawingFormHelper.resetReplay();
                this.drawingFormHelper.DrawFinishedSendedCards();
                return;
            }
            isNormalShowCards = trick.ShowedCards.length == 4;
            if (isOnePlayerAtATimeInit && isNormalShowCards) {
                this.onePlayerAtATime.winner = trick.Winner;
                this.onePlayerAtATime.points = trick.Points();
                this.onePlayerAtATime.scoreCards = trick.ScoreCards();
            }
        }
        if (!isOnePlayerAtATime || isOnePlayerAtATimeInit) {
            this.drawingFormHelper.resetReplay();
            if (isOnePlayerAtATimeInit) {
                this.drawAllPlayerHandCards();
            }
        }
        if (!isOnePlayerAtATime || isOnePlayerAtATimeInit) {
            if (trick.ShowedCards.length == 1 && this.PlayerPosition[trick.Learder] == 1) {
                this.DrawDumpFailureMessage(trick);
            }
        }
        var curPlayer;
        if (!isOnePlayerAtATime || isOnePlayerAtATimeInit) {
            this.tractorPlayer.CurrentTrickState = trick;
            curPlayer = trick.Learder;
        }
        var drawDelay = 100;
        var i = 1;
        if (!isOnePlayerAtATime || isOnePlayerAtATimeInit) {
            var _loop_6 = function () {
                var position = this_5.PlayerPosition[curPlayer];
                if (isNormalShowCards) {
                    CommonMethods.GetShowedCardsByPlayerID(trick.ShowedCards, curPlayer).forEach(function (card) {
                        _this.tractorPlayer.replayEntity.CurrentHandState.PlayerHoldingCards[curPlayer].RemoveCard(card);
                    });
                }
                var cardsList = CommonMethods.deepCopy(CommonMethods.GetShowedCardsByPlayerID(trick.ShowedCards, curPlayer));
                if (isOnePlayerAtATimeInit) {
                    this_5.onePlayerAtATime.cardsListList.push(cardsList);
                    this_5.onePlayerAtATime.positionList.push(position);
                }
                else {
                    setTimeout(function () {
                        _this.drawingFormHelper.DrawShowedCardsByPosition(cardsList, position);
                    }, i * drawDelay);
                }
                curPlayer = CommonMethods.GetNextPlayerAfterThePlayer(this_5.tractorPlayer.CurrentGameState.Players, curPlayer).PlayerId;
            };
            var this_5 = this;
            for (; i <= trick.ShowedCards.length; i++) {
                _loop_6();
            }
        }
        if (isOnePlayerAtATime) {
            this.onePlayerAtATime.DrawShowedCardsOnePlayerAtATime();
        }
        if (!isOnePlayerAtATime || isOnePlayerAtATimeInit) {
            if (trick.ShowedCards.length == 1 && this.PlayerPosition[trick.Learder] != 1) {
                this.DrawDumpFailureMessage(trick);
            }
        }
        if (isOnePlayerAtATime) {
            // 如果刚刚画完的出牌是自己的，则重画刷新自己的手牌
            if (this.onePlayerAtATime.positionList[this.onePlayerAtATime.curIndex - 1] == 1) {
                this.drawingFormHelper.destroyAllCards();
                this.drawAllPlayerHandCards();
            }
        }
        else {
            setTimeout(function () {
                _this.drawAllPlayerHandCards();
            }, i * drawDelay);
        }
        if (!isOnePlayerAtATime) {
            if (trick.Winner) {
                if (!this.tractorPlayer.CurrentGameState.ArePlayersInSameTeam(this.tractorPlayer.CurrentHandState.Starter, trick.Winner)) {
                    this.tractorPlayer.CurrentHandState.Score += trick.Points();
                    //收集得分牌
                    this.tractorPlayer.CurrentHandState.ScoreCards = this.tractorPlayer.CurrentHandState.ScoreCards.concat(trick.ScoreCards());
                }
            }
        }
        else {
            if (this.onePlayerAtATime.curIndex == 4 && this.onePlayerAtATime.winner) {
                if (!this.tractorPlayer.CurrentGameState.ArePlayersInSameTeam(this.tractorPlayer.CurrentHandState.Starter, this.onePlayerAtATime.winner)) {
                    this.tractorPlayer.CurrentHandState.Score += this.onePlayerAtATime.points;
                    //收集得分牌
                    this.tractorPlayer.CurrentHandState.ScoreCards = this.tractorPlayer.CurrentHandState.ScoreCards.concat(this.onePlayerAtATime.scoreCards);
                }
            }
        }
        this.drawingFormHelper.DrawScoreImageAndCards();
    };
    MainForm.prototype.DrawDumpFailureMessage = function (trick) {
        this.tractorPlayer.NotifyMessage([
            "\u73A9\u5BB6\u3010".concat(trick.Learder, "\u3011"),
            "\u7529\u724C".concat(CommonMethods.GetShowedCardsByPlayerID(trick.ShowedCards, trick.Learder).length, "\u5F20\u5931\u8D25"),
            "\u7F5A\u5206\uFF1A".concat(CommonMethods.GetShowedCardsByPlayerID(trick.ShowedCards, trick.Learder).length * 10),
            "",
            "",
            "",
            ""
        ]);
    };
    MainForm.prototype.btnFirstPersonView_Click = function () {
        if (this.gameScene.yesFirstPersonView === "false") {
            this.gameScene.yesFirstPersonView = "true";
            this.btnFirstPersonView.innerText = "全开视角";
        }
        else {
            this.gameScene.yesFirstPersonView = "false";
            this.btnFirstPersonView.innerText = "第一视角";
        }
        this.StartReplay(true);
    };
    MainForm.prototype.btnFirstTrick_Click = function () {
        if (this.onePlayerAtATime) {
            this.onePlayerAtATime.curIndex = 4;
        }
        if (this.tractorPlayer.replayedTricks.length > 0)
            this.loadReplayEntity(this.currentReplayEntities[1][this.selectTimes.selectedIndex], true);
        else {
            if (this.replayPreviousFile())
                this.btnLastTrick_Click();
        }
    };
    MainForm.prototype.btnPreviousTrick_Click = function () {
        if (this.onePlayerAtATime) {
            this.onePlayerAtATime.curIndex = 4;
        }
        if (this.tractorPlayer.replayedTricks.length > 1) {
            this.drawingFormHelper.resetReplay();
            this.revertReplayTrick();
            this.revertReplayTrick();
            this.replayNextTrick();
        }
        else if (this.tractorPlayer.replayedTricks.length == 1) {
            this.btnFirstTrick_Click();
        }
        else {
            if (this.replayPreviousFile())
                this.btnLastTrick_Click();
        }
    };
    MainForm.prototype.btnNextTrick_Click = function () {
        if (this.tractorPlayer.replayEntity.CurrentTrickStates.length == 0) {
            this.replayNextFile();
            return;
        }
        this.replayNextTrick();
    };
    MainForm.prototype.btnLastTrick_Click = function () {
        var _this = this;
        if (this.onePlayerAtATime) {
            this.onePlayerAtATime.curIndex = 4;
        }
        if (this.tractorPlayer.replayEntity.CurrentTrickStates.length > 0) {
            var _loop_7 = function () {
                var trick = this_6.tractorPlayer.replayEntity.CurrentTrickStates[0];
                this_6.tractorPlayer.replayedTricks.push(trick);
                this_6.tractorPlayer.replayEntity.CurrentTrickStates.shift();
                // 甩牌失败
                if (trick.ShowedCards.length == 1)
                    return "continue";
                var curPlayer = trick.Learder;
                for (var i = 0; i < trick.ShowedCards.length; i++) {
                    CommonMethods.GetShowedCardsByPlayerID(trick.ShowedCards, curPlayer).forEach(function (card) {
                        _this.tractorPlayer.replayEntity.CurrentHandState.PlayerHoldingCards[curPlayer].RemoveCard(card);
                    });
                    curPlayer = CommonMethods.GetNextPlayerAfterThePlayer(this_6.tractorPlayer.CurrentGameState.Players, curPlayer).PlayerId;
                }
            };
            var this_6 = this;
            while (this.tractorPlayer.replayEntity.CurrentTrickStates.length > 1) {
                _loop_7();
            }
            this.drawingFormHelper.DrawHandCardsByPosition(1, this.tractorPlayer.CurrentPoker, 1);
            this.replayNextTrick();
        }
        else
            this.replayNextFile();
    };
    MainForm.prototype.replayPreviousFile = function () {
        if (this.selectTimes.selectedIndex > 0) {
            this.selectTimes.selectedIndex = this.selectTimes.selectedIndex - 1;
            this.loadReplayEntity(this.currentReplayEntities[1][this.selectTimes.selectedIndex], false);
            return true;
        }
        else if (this.selectDates.selectedIndex > 0) {
            this.selectDates.selectedIndex = this.selectDates.selectedIndex - 1;
            this.onDatesSelectChange(false, -1);
            if (this.selectTimes.options && this.selectTimes.options.length > 0) {
                this.selectTimes.selectedIndex = this.selectTimes.options.length - 1;
                this.loadReplayEntity(this.currentReplayEntities[1][this.selectTimes.selectedIndex], false);
                return true;
            }
        }
        return false;
    };
    MainForm.prototype.replayNextFile = function () {
        if (this.selectTimes.selectedIndex < this.selectTimes.options.length - 1) {
            this.selectTimes.selectedIndex = this.selectTimes.selectedIndex + 1;
            this.loadReplayEntity(this.currentReplayEntities[1][this.selectTimes.selectedIndex], true);
        }
        else if (this.selectDates.selectedIndex < this.selectDates.options.length - 1) {
            this.selectDates.selectedIndex = this.selectDates.selectedIndex + 1;
            this.onDatesSelectChange(false, 1);
            if (this.selectTimes.options && this.selectTimes.options.length > 0) {
                this.loadReplayEntity(this.currentReplayEntities[1][this.selectTimes.selectedIndex], true);
            }
        }
    };
    MainForm.prototype.revertReplayTrick = function () {
        var _this = this;
        var trick = this.tractorPlayer.replayedTricks.pop();
        this.tractorPlayer.replayEntity.CurrentTrickStates.unshift(trick);
        if (trick.Rank < 0) {
            this.tractorPlayer.CurrentHandState.Score -= this.tractorPlayer.CurrentHandState.ScorePunishment + this.tractorPlayer.CurrentHandState.ScoreLast8CardsBase * this.tractorPlayer.CurrentHandState.ScoreLast8CardsMultiplier;
            if (this.shouldShowLast8Cards())
                this.drawingFormHelper.DrawDiscardedCards();
        }
        else if (Object.keys(trick.ShowedCards).length == 4) {
            var _loop_8 = function (i) {
                var keyValue = trick.ShowedCards[i];
                keyValue.Cards.forEach(function (card) {
                    _this.tractorPlayer.replayEntity.CurrentHandState.PlayerHoldingCards[keyValue.PlayerID].AddCard(card);
                });
            };
            for (var i = 0; i < trick.ShowedCards.length; i++) {
                _loop_8(i);
            }
            if (trick.Winner) {
                if (!this.tractorPlayer.CurrentGameState.ArePlayersInSameTeam(this.tractorPlayer.CurrentHandState.Starter, trick.Winner)) {
                    this.tractorPlayer.CurrentHandState.Score -= trick.Points();
                    //收集得分牌
                    trick.ScoreCards().forEach(function (sc) {
                        _this.tractorPlayer.CurrentHandState.ScoreCards = CommonMethods.ArrayRemoveOneByValue(_this.tractorPlayer.CurrentHandState.ScoreCards, sc);
                    });
                }
            }
            this.drawingFormHelper.DrawScoreImageAndCards();
        }
    };
    // pos is 1-based
    MainForm.prototype.replayAngleByPosition = function (pos) {
        var angleOffset = pos - 1;
        this.tractorPlayer.replayAngle = (this.tractorPlayer.replayAngle + angleOffset) % 4;
        this.tractorPlayer.replayEntity.Players = CommonMethods.RotateArray(this.tractorPlayer.replayEntity.Players, angleOffset);
        if (this.tractorPlayer.replayEntity.PlayerRanks != null) {
            this.tractorPlayer.replayEntity.PlayerRanks = CommonMethods.RotateArray(this.tractorPlayer.replayEntity.PlayerRanks, angleOffset);
        }
        this.StartReplay(true);
    };
    MainForm.prototype.onDatesSelectChange = function (isFromClick, direction) {
        var _this = this;
        if (isFromClick) {
            this.currentReplayEntities = [undefined, undefined, undefined];
            IDBHelper.ReadReplayEntityByDate(this.selectDates.value, function (reList) {
                _this.currentReplayEntities[1] = reList;
                _this.removeOptions(_this.selectTimes);
                for (var i = 0; i < reList.length; i++) {
                    var re = reList[i];
                    var datetimes = re.ReplayId.split(IDBHelper.replaySeparator);
                    var timeString = datetimes[1];
                    var option = document.createElement("option");
                    option.text = timeString;
                    _this.selectTimes.add(option);
                }
            });
            var prevDatesIndex = this.selectDates.selectedIndex - 1;
            if (prevDatesIndex >= 0) {
                IDBHelper.ReadReplayEntityByDate(this.selectDates.options[prevDatesIndex].value, function (reList) {
                    _this.currentReplayEntities[0] = reList;
                });
            }
            var nextDatesIndex = this.selectDates.selectedIndex + 1;
            if (nextDatesIndex < this.selectDates.options.length) {
                IDBHelper.ReadReplayEntityByDate(this.selectDates.options[nextDatesIndex].value, function (reList) {
                    _this.currentReplayEntities[2] = reList;
                });
            }
        }
        else {
            this.removeOptions(this.selectTimes);
            var reList = this.currentReplayEntities[1 + direction];
            for (var i = 0; i < reList.length; i++) {
                var re = reList[i];
                var datetimes = re.ReplayId.split(IDBHelper.replaySeparator);
                var timeString = datetimes[1];
                var option = document.createElement("option");
                option.text = timeString;
                this.selectTimes.add(option);
            }
            var newDatesIndex = this.selectDates.selectedIndex + direction;
            if (direction < 0) {
                this.currentReplayEntities.pop();
                this.currentReplayEntities.unshift(undefined);
                if (newDatesIndex >= 0) {
                    IDBHelper.ReadReplayEntityByDate(this.selectDates.options[newDatesIndex].value, function (reList) {
                        _this.currentReplayEntities[0] = reList;
                    });
                }
            }
            else {
                this.currentReplayEntities.shift();
                this.currentReplayEntities.push(undefined);
                if (newDatesIndex < this.selectDates.options.length) {
                    IDBHelper.ReadReplayEntityByDate(this.selectDates.options[newDatesIndex].value, function (reList) {
                        _this.currentReplayEntities[2] = reList;
                    });
                }
            }
        }
    };
    MainForm.prototype.shouldShowLast8Cards = function () {
        return this.gameScene.yesFirstPersonView !== "true" ||
            this.tractorPlayer.CurrentHandState.Starter === this.tractorPlayer.replayEntity.Players[0];
    };
    MainForm.prototype.removeOptions = function (selectElement) {
        var i, L = selectElement.options.length - 1;
        for (i = L; i >= 0; i--) {
            selectElement.remove(i);
        }
    };
    MainForm.prototype.FullScreenPop = function (str) {
        var node = this.gameScene.ui.create.div('.damage');
        node.innerHTML = str;
        node.dataset.nature = 'thunder';
        this.gameScene.ui.window.appendChild(node);
        this.gameScene.ui.refresh(node);
        node.classList.add('damageadded');
        setTimeout(function () {
            node.delete();
            node.style.transform = 'scale(1.5)';
        }, 1600);
    };
    MainForm.prototype.WaitForPlayer = function (timerLength, playerID) {
        var _this = this;
        this.ClearTimer();
        var pos = this.PlayerPosition[playerID];
        var playerUI = undefined;
        var onend = undefined;
        var playCountDownAudio = function () {
            _this.gameScene.playAudio(CommonMethods.audioCountdown8Sec);
        };
        var isSomeoneElse = false;
        if (playerID === this.tractorPlayer.PlayerId) {
            this.gameScene.ui.timer.show();
            onend = function () {
                _this.gameScene.ui.timer.hide();
                // if actual player, trigger robot
                if (!_this.tractorPlayer.isObserver) {
                    _this.btnRobot_Click();
                }
            };
            playerUI = this.gameScene.ui.gameMe;
        }
        else {
            if (playerID in this.PlayerPosition) {
                isSomeoneElse = true;
                playerUI = this.gameScene.ui.gameRoomImagesChairOrPlayer[pos - 1];
                if (playerUI)
                    playerUI.showTimer(1000 * timerLength);
            }
        }
        // 如果游戏还没进行到到庄家埋底阶段，则无需触发倒计时提示特效（切牌无需倒计时提示）
        if (this.tractorPlayer.CurrentHandState.CurrentHandStep < SuitEnums.HandStep.DiscardingLast8Cards) {
            playerUI = undefined;
            playCountDownAudio = undefined;
        }
        this.gameScene.game.countDown(timerLength, onend, true, playerUI, playCountDownAudio, isSomeoneElse);
    };
    MainForm.prototype.UnwaitForPlayer = function (playerID) {
        this.ClearTimer();
        this.gameScene.stopAudio(CommonMethods.audioCountdown8Sec);
        if (playerID !== this.tractorPlayer.PlayerId) {
            if (playerID in this.PlayerPosition) {
                var pos = this.PlayerPosition[playerID];
                var playerUI = this.gameScene.ui.gameRoomImagesChairOrPlayer[pos - 1];
                if (playerUI)
                    playerUI.hideTimer();
            }
        }
    };
    return MainForm;
}());
export { MainForm };
