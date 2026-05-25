var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { CurrentPoker } from './current_poker.js';
import { ShowedCardKeyValue } from './showed_card_key_value.js';
import { SuitEnums } from './suit_enums.js';
export var CommonMethods = /** @class */ (function () {
    function CommonMethods() {
    }
    CommonMethods.ArrayIsEqual = function (a, b) {
        if (a == null || b == null) {
            return false;
        }
        if (a.length != b.length) {
            return false;
        }
        for (var i = 0; i < a.length; i++) {
            if (!b.includes(a[i])) {
                return false;
            }
        }
        for (var i = 0; i < b.length; i++) {
            if (!a.includes(b[i])) {
                return false;
            }
        }
        return true;
    };
    CommonMethods.DeepEqualArray = function (a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    };
    CommonMethods.FindDiffCards = function (a, b) {
        var diffCards = [];
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                diffCards.push(i);
            }
        }
        return diffCards;
    };
    CommonMethods.IncludesByPlayerID = function (a, b) {
        for (var i = 0; i < a.length; i++) {
            var p = a[i];
            if (p != null && p.PlayerId == b) {
                return true;
            }
        }
        return false;
    };
    CommonMethods.GetReadyCount = function (a) {
        var count = 0;
        for (var i = 0; i < a.length; i++) {
            var p = a[i];
            if (p != null && p.IsReadyToStart) {
                count++;
            }
        }
        return count;
    };
    CommonMethods.GetPlayerCount = function (a) {
        var count = 0;
        for (var i = 0; i < a.length; i++) {
            var p = a[i];
            if (p != null) {
                count++;
            }
        }
        return count;
    };
    CommonMethods.GetPlayerIndexByID = function (a, playerID) {
        for (var i = 0; i < a.length; i++) {
            var p = a[i];
            if (p != null && p.PlayerId == playerID) {
                return i;
            }
        }
        // 核心加固：支持通过 [空位 X] 定位索引
        if (playerID && playerID.indexOf("[空位 ") !== -1) {
            var idx = parseInt(playerID.replace("[空位 ", "").replace("]", "")) - 1;
            if (!isNaN(idx)) return idx;
        }
        return -1;
    };
    CommonMethods.GetPlayerByID = function (a, playerID) {
        var res;
        for (var i = 0; i < a.length; i++) {
            var p = a[i];
            if (p != null && p.PlayerId == playerID) {
                res = p;
                break;
            }
        }
        if (!res && playerID && playerID.indexOf("[空位 ") !== -1) {
            return { PlayerId: playerID, IsReadyToStart: false, Observers: [] };
        }
        return res;
    };
    CommonMethods.GetPlayerIndexByPos = function (a, playerID, pos) {
        var selfIndex = CommonMethods.GetPlayerIndexByID(a, playerID);
        if (selfIndex === -1) selfIndex = 0;
        return (selfIndex + (pos - 1)) % 4;
    };
    CommonMethods.GetNextPlayerAfterThePlayer = function (a, playerId) {
        var thisPlayerIndex = CommonMethods.GetPlayerIndexByID(a, playerId);
        if (thisPlayerIndex === -1) thisPlayerIndex = 0;
        var nextIdx = (thisPlayerIndex + 1) % 4;
        var nextP = a[nextIdx];
        if (nextP == null) {
            return { PlayerId: "[空位 " + (nextIdx + 1) + "]", IsReadyToStart: false, Observers: [] };
        }
        return nextP;
    };
    CommonMethods.BuildCardNumMap = function () {
        //based on front_end\src\assets\poker.png
        //server:
        //红桃0-12
        //黑桃13-25
        //方块26-38
        //梅花39-51
        //小王52
        //大王53
        //UI:
        //红桃0-12
        //方块13-25
        //黑桃26-38
        //梅花39-51
        //大王52
        //小王53
        CommonMethods.ServerToUICardMap = [];
        CommonMethods.UIToServerCardMap = [];
        for (var i = 0; i < 13; i++) {
            if (i < 12)
                CommonMethods.ServerToUICardMap[i] = i + 1;
            else
                CommonMethods.ServerToUICardMap[i] = i + 1 - 13;
            if (i > 0)
                CommonMethods.UIToServerCardMap[i] = i - 1;
            else
                CommonMethods.UIToServerCardMap[i] = i - 1 + 13;
        }
        for (var i = 13; i < 26; i++) {
            if (i < 25)
                CommonMethods.ServerToUICardMap[i] = i + 1 + 13;
            else
                CommonMethods.ServerToUICardMap[i] = i + 1 - 13 + 13;
            if (i > 13)
                CommonMethods.UIToServerCardMap[i] = i - 1 + 13;
            else
                CommonMethods.UIToServerCardMap[i] = i - 1 + 13 + 13;
        }
        for (var i = 26; i < 39; i++) {
            if (i < 38)
                CommonMethods.ServerToUICardMap[i] = i + 1 - 13;
            else
                CommonMethods.ServerToUICardMap[i] = i + 1 - 13 - 13;
            if (i > 26)
                CommonMethods.UIToServerCardMap[i] = i - 1 - 13;
            else
                CommonMethods.UIToServerCardMap[i] = i - 1 + 13 - 13;
        }
        for (var i = 39; i < 52; i++) {
            if (i < 51)
                CommonMethods.ServerToUICardMap[i] = i + 1;
            else
                CommonMethods.ServerToUICardMap[i] = i + 1 - 13;
            if (i > 39)
                CommonMethods.UIToServerCardMap[i] = i - 1;
            else
                CommonMethods.UIToServerCardMap[i] = i - 1 + 13;
        }
        CommonMethods.ServerToUICardMap[52] = 53;
        CommonMethods.UIToServerCardMap[52] = 53;
        CommonMethods.ServerToUICardMap[53] = 52;
        CommonMethods.UIToServerCardMap[53] = 52;
        CommonMethods.ServerToUICardMap[54] = 54;
        CommonMethods.UIToServerCardMap[54] = 54;
    };
    CommonMethods.ArrayCopy = function (from, start, len) {
        var to = [];
        for (var i = start; i < start + len; i++) {
            to.push(from[i]);
        }
        return to;
    };
    CommonMethods.ArraySum = function (from) {
        var sum = 0;
        if (from == undefined)
            return sum;
        from.forEach(function (element) {
            sum += element;
        });
        return sum;
    };
    CommonMethods.deepCopy = function (instance) {
        if (instance == null) {
            return instance;
        }
        // handle Dates
        if (instance instanceof Date) {
            return new Date(instance.getTime());
        }
        // handle Array types
        if (instance instanceof Array) {
            var cloneArr = [];
            instance.forEach(function (value) { cloneArr.push(value); });
            // for nested objects
            return cloneArr.map(function (value) { return CommonMethods.deepCopy(value); });
        }
        // handle objects
        if (instance instanceof Object) {
            var copyInstance = __assign({}, instance);
            for (var attr in instance) {
                if (instance.hasOwnProperty(attr))
                    copyInstance[attr] = CommonMethods.deepCopy(instance[attr]);
            }
            return copyInstance;
        }
        // handling primitive data types
        return instance;
    };
    CommonMethods.ArrayRemoveOneByValue = function (arr, value) {
        var to = [];
        var found = false;
        for (var i = 0; i < arr.length; i++) {
            if (found || arr[i] != value)
                to.push(arr[i]);
            else
                found = true;
        }
        return to;
    };
    CommonMethods.ArrayMinus = function (arr1, arr2) {
        var res = this.deepCopy(arr1);
        for (var i = 0; i < arr2.length; i++) {
            if (res.includes(arr2[i]))
                res = this.ArrayRemoveOneByValue(res, arr2[i]);
        }
        return res;
    };
    /// <summary>
    ///     得到一个牌的花色
    /// </summary>
    /// <param name="a">牌值</param>
    /// <returns>花色</returns>
    CommonMethods.GetSuit = function (a) {
        if (a >= 0 && a < 13) {
            return 1;
        }
        if (a >= 13 && a < 26) {
            return 2;
        }
        if (a >= 26 && a < 39) {
            return 3;
        }
        if (a >= 39 && a < 52) {
            return 4;
        }
        return 5;
    };
    CommonMethods.GetSuitString = function (a) {
        var suitInt = CommonMethods.GetSuit(a);
        var suit = suitInt;
        return SuitEnums.NumberToSuit[suit];
    };
    CommonMethods.GetNumberString = function (a) {
        if (a == 52) {
            return "Small";
        }
        if (a == 53) {
            return "Big";
        }
        return CommonMethods.cardNumToValue[a % 13];
    };
    CommonMethods.GetScoreCardsScore = function (scoreCards) {
        var points = 0;
        scoreCards.forEach(function (card) {
            if (card % 13 == 3)
                points += 5;
            else if (card % 13 == 8)
                points += 10;
            else if (card % 13 == 11)
                points += 10;
        });
        return points;
    };
    CommonMethods.AllOnline = function (players) {
        for (var i = 0; i < 4; i++) {
            if (players[i] == null || players[i].IsOffline)
                return false;
        }
        return true;
    };
    CommonMethods.AllReady = function (players) {
        for (var i = 0; i < 4; i++) {
            if (players[i] == null || !players[i].IsReadyToStart)
                return false;
        }
        return true;
    };
    CommonMethods.SomeoneBecomesReady = function (oldOnes, newOnes) {
        var becomeReadyCount = 0;
        for (var i = 0; i < 4; i++) {
            if ((oldOnes[i] == null || !oldOnes[i].IsReadyToStart) && (newOnes[i] != null && newOnes[i].IsReadyToStart))
                becomeReadyCount++;
        }
        return becomeReadyCount == 1;
    };
    /// <summary>
    ///     比较两张牌孰大孰小
    /// </summary>
    /// <param name="a">第一张牌</param>
    /// <param name="b">第二张牌</param>
    /// <param name="suit">主花色</param>
    /// <param name="rank">主Rank</param>
    /// <param name="firstSuit">第一张牌的花色</param>
    /// <returns>如果第一张大于等于第二张牌，返回true,否则返回false</returns>
    CommonMethods.CompareTo = function (a, b, suit, rank, firstSuit) {
        if ((a == -1) && (b == -1)) {
            return true;
        }
        if ((a == -1) && (b != -1)) {
            return false;
        }
        if ((a != -1) && (b == -1)) {
            return true;
        }
        var suit1 = this.GetSuitByTrumpAndRank(a, suit, rank);
        var suit2 = this.GetSuitByTrumpAndRank(b, suit, rank);
        if ((suit1 == firstSuit) && (suit2 != firstSuit)) {
            if (suit1 == suit) {
                return true;
            }
            if (suit2 == suit) {
                return false;
            }
            return true;
        }
        if ((suit1 != firstSuit) && (suit2 == firstSuit)) {
            if (suit1 == suit) {
                return true;
            }
            if (suit2 == suit) {
                return false;
            }
            return false;
        }
        if (a == 53) {
            return true;
        }
        if (a == 52) {
            if (b == 53) {
                return false;
            }
            return true;
        }
        if (b == 52) {
            if (a == 53) {
                return true;
            }
            return false;
        }
        if (a == (suit - 1) * 13 + rank) {
            if (b == 53 || b == 52) {
                return false;
            }
            return true;
        }
        if (a % 13 == rank) {
            if (b == 53 || b == 52 || (b == (suit - 1) * 13 + rank)) {
                return false;
            }
            return true;
        }
        if (b == (suit - 1) * 13 + rank) {
            if (a == 53 || a == 52) {
                return true;
            }
            return false;
        }
        if (b % 13 == rank) {
            if (a == 53 || a == 52 || (a == (suit - 1) * 13 + rank)) {
                return true;
            }
            return false;
        }
        if ((suit1 == suit) && (suit2 != suit)) {
            return true;
        }
        if ((suit1 != suit) && (suit2 == suit)) {
            return false;
        }
        if (suit1 == suit2) {
            return (a - b >= 0);
        }
        return true;
    };
    /// <summary>
    ///     得到一张牌的花色，如果是主，则返回主的花色
    /// </summary>
    /// <param name="a">牌值</param>
    /// <param name="suit">主花色</param>
    /// <param name="rank">主Rank</param>
    /// <returns>花色</returns>
    CommonMethods.GetSuitByTrumpAndRank = function (a, suit, rank) {
        var firstSuit = 0;
        if (a == 53 || a == 52) {
            firstSuit = suit;
        }
        else if ((a % 13) == rank) {
            firstSuit = suit;
        }
        else {
            firstSuit = CommonMethods.GetSuitByCardNumber(a);
        }
        return firstSuit;
    };
    /// <summary>
    ///     得到一个牌的花色
    /// </summary>
    /// <param name="a">牌值</param>
    /// <returns>花色</returns>
    CommonMethods.GetSuitByCardNumber = function (a) {
        if (a >= 0 && a < 13) {
            return 1;
        }
        if (a >= 13 && a < 26) {
            return 2;
        }
        if (a >= 26 && a < 39) {
            return 3;
        }
        if (a >= 39 && a < 52) {
            return 4;
        }
        return 5;
    };
    CommonMethods.GetMaxCard = function (cards, trump, rank) {
        var cp = new CurrentPoker();
        cp.Trump = trump;
        cp.Rank = rank;
        cards.forEach(function (card) {
            cp.AddCard(card);
        });
        //cp.Sort();
        if (cp.IsMixed()) {
            return -1;
        }
        if (cp.RedJoker() > 0)
            return 53;
        if (cp.BlackJoker() > 0)
            return 52;
        if (cp.MasterRank() > 0)
            return rank + (trump - 1) * 13;
        if (cp.HeartsRankTotal() > 0)
            return rank;
        if (cp.SpadesRankTotal() > 0)
            return rank + 13;
        if (cp.DiamondsRankTotal() > 0)
            return rank + 26;
        if (cp.ClubsRankTotal() > 0)
            return rank + 39;
        for (var i = 51; i > -1; i--) {
            if (cards.includes(i))
                return i;
        }
        return -1;
    };
    CommonMethods.GetRandomInt = function (max) {
        return Math.floor(Math.random() * max);
    };
    CommonMethods.IsNumber = function (str) {
        if (typeof str != "string")
            return false; // we only process strings!  
        return !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
    };
    CommonMethods.RotateArray = function (arr, pivot) {
        pivot = pivot % arr.length;
        return arr.slice(pivot, arr.length).concat(arr.slice(0, pivot));
    };
    CommonMethods.getNumOfSuits = function (currentPoker) {
        var num = 0;
        if (currentPoker == null)
            return num;
        for (var i = 1; i <= 4; i++) {
            if (currentPoker.HasSomeCards(i))
                num++;
        }
        if (currentPoker.Trump == SuitEnums.Suit.Joker && currentPoker.HasSomeCards(5))
            num++;
        return num;
    };
    CommonMethods.isTouchDevice = function () {
        return ('ontouchstart' in window) || (window.matchMedia("(pointer: coarse)").matches);
    };
    CommonMethods.GetCookieExpires = function () {
        var result = new Date();
        result.setDate(result.getDate() + CommonMethods.cookieExpireInDays);
        return result;
    };
    CommonMethods.DateToISO8601 = function (date) {
        // Get the timezone offset in minutes and convert it to hours and minutes
        var timezoneOffsetHours = Math.floor(date.getTimezoneOffset() / 60);
        var timezoneOffsetMinutes = date.getTimezoneOffset() % 60;
        // Format the date to ISO 8601 format with timezone
        return date.getFullYear() +
            '-' + CommonMethods.Pad(date.getMonth() + 1) +
            '-' + CommonMethods.Pad(date.getDate()) +
            'T' + CommonMethods.Pad(date.getHours()) +
            ':' + CommonMethods.Pad(date.getMinutes()) +
            ':' + CommonMethods.Pad(date.getSeconds()) +
            (date.getTimezoneOffset() < 0 ? '+' : '-') +
            CommonMethods.Pad(Math.abs(timezoneOffsetHours)) +
            ':' + CommonMethods.Pad(Math.abs(timezoneOffsetMinutes));
    }; // Function to add leading zeros to single-digit numbers
    CommonMethods.Pad = function (number) {
        if (number < 10) {
            return '0' + number;
        }
        return number;
    };
    CommonMethods.GetShowedCardsByPlayerID = function (showedCards, id) {
        for (var i = 0; i < showedCards.length; i++) {
            var keyValue = showedCards[i];
            if (keyValue.PlayerID.toLowerCase() === id.toLowerCase()) {
                return keyValue.Cards;
            }
        }
        return [];
    };
    CommonMethods.SetShowedCardsByPlayerID = function (showedCards, id, cards) {
        var newEntry = new ShowedCardKeyValue();
        newEntry.PlayerID = id;
        newEntry.Cards = cards;
        var isFound = false;
        for (var i = 0; i < showedCards.length; i++) {
            if (showedCards[i].PlayerID.toLowerCase() === id.toLowerCase()) {
                showedCards[i] = newEntry; // if found Replace
                isFound = true;
                break;
            }
        }
        if (!isFound) {
            showedCards.push(newEntry); // otherwise Append
        }
        return showedCards;
    };
    CommonMethods.RemoveFirstValueFromArray = function (arr, value) {
        var index = arr.indexOf(value);
        if (index !== -1) {
            arr.splice(index, 1);
        }
    };
    CommonMethods.GetRankByTeam = function (a, team) {
        var index = team == 1 ? 0 : 1;
        var p = a[index];
        if (p) {
            return p.Rank;
        }
        return 0;
    };
    CommonMethods.storageFileForCardsKey = "storageFileForCards";
    CommonMethods.SendJoinOrQuitYuezhan_REQUEST = "SendJoinOrQuitYuezhan";
    CommonMethods.SendAwardOnlineBonus_REQUEST = "SendAwardOnlineBonus";
    CommonMethods.SET_PLAYER_NAME_REQUEST = "set_player_name";
    CommonMethods.PLAYER_CLIENT_TYPE_shengjiweb = "PlayerClientType_shengjiweb";
    CommonMethods.PLAYER_CLIENT_TYPE_TLJAPP = "PlayerClientType_tljapp";
    CommonMethods.PLAYER_ENTER_HALL_DELIMITER = "-version-";
    CommonMethods.PLAYER_ENTER_HALL_VERSION_UNKNOWN = "unknown";
    CommonMethods.PLAYER_ENTER_HALL_REQUEST = "PlayerEnterHall";
    CommonMethods.JOIN_ROOM_REQUEST = "join_room";
    CommonMethods.PREPARE_REQUEST = "prepare";
    CommonMethods.ROOM_LIST_RESPONSE = "room_list";
    CommonMethods.EXISTS_PLAYERS_RESPONSE = "exists_players";
    CommonMethods.DEAL_POKER_RESPONSE = "deal_poker";
    CommonMethods.NotifyGameHall_RESPONSE = "NotifyGameHall";
    CommonMethods.NotifyOnlinePlayerList_RESPONSE = "NotifyOnlinePlayerList";
    CommonMethods.NotifyDaojuInfo_RESPONSE = "NotifyDaojuInfo";
    CommonMethods.NotifyGameRoomPlayerList_RESPONSE = "NotifyGameRoomPlayerList";
    CommonMethods.NotifyMessage_RESPONSE = "NotifyMessage";
    CommonMethods.NotifyRoomSetting_RESPONSE = "NotifyRoomSetting";
    CommonMethods.NotifyGameState_RESPONSE = "NotifyGameState";
    CommonMethods.NotifyCurrentHandState_RESPONSE = "NotifyCurrentHandState";
    CommonMethods.NotifyCurrentTrickState_RESPONSE = "NotifyCurrentTrickState";
    CommonMethods.GetDistributedCard_RESPONSE = "GetDistributedCard";
    CommonMethods.NotifyCardsReady_RESPONSE = "NotifyCardsReady";
    CommonMethods.NotifyDumpingValidationResult_RESPONSE = "NotifyDumpingValidationResult"; // failure
    CommonMethods.NotifyTryToDumpResult_RESPONSE = "NotifyTryToDumpResult"; // both
    CommonMethods.NotifyStartTimer_RESPONSE = "NotifyStartTimer"; // both
    CommonMethods.NotifyEmoji_RESPONSE = "NotifyEmoji";
    CommonMethods.CutCardShoeCards_RESPONSE = "CutCardShoeCards";
    CommonMethods.NotifyReplayState_RESPONSE = "NotifyReplayState";
    CommonMethods.NotifyPing_RESPONSE = "NotifyPing";
    CommonMethods.NotifySgcsPlayerUpdated_RESPONSE = "NotifySgcsPlayerUpdated";
    CommonMethods.NotifyCreateCollectStar_RESPONSE = "NotifyCreateCollectStar";
    CommonMethods.NotifyEndCollectStar_RESPONSE = "NotifyEndCollectStar";
    CommonMethods.NotifyGrabStar_RESPONSE = "NotifyGrabStar";
    CommonMethods.NotifyUpdateGobang_RESPONSE = "NotifyUpdateGobang";
    CommonMethods.SendEmoji_REQUEST = "SendEmoji";
    CommonMethods.SendBroadcast_REQUEST = "SendBroadcast";
    CommonMethods.BuyNoDongtuUntil_REQUEST = "BuyNoDongtuUntil";
    CommonMethods.PlayerHasCutCards_REQUEST = "PlayerHasCutCards";
    CommonMethods.cardNumToValue = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    CommonMethods.reenterRoomSignal = "断线重连中,请稍后...";
    CommonMethods.resumeGameSignal = "牌局加载中,请稍后...";
    CommonMethods.systemMsgPrefix = "【系统消息】：";
    CommonMethods.wsErrorType_Insecure = "insecure";
    CommonMethods.chatMaxLength = 100;
    CommonMethods.danmuMaxLength = 30;
    CommonMethods.zIndexGameMe = -1;
    CommonMethods.zIndexDanmu = 10;
    CommonMethods.zIndexFrameChat = 11;
    CommonMethods.zIndexSettingsForm = 100;
    CommonMethods.zIndexFrameGameHallOnliners = 1;
    CommonMethods.zeroDuration = "00:00:00";
    CommonMethods.OnlineBonusMunitesRequired = 60;
    CommonMethods.gifferPrefix = "playerGiffer";
    CommonMethods.winEmojiLength = 4;
    CommonMethods.danmuDuration = 8;
    CommonMethods.distributeLast8Delay = 0.2;
    CommonMethods.distributeLast8Interval = 0.1;
    CommonMethods.distributeLast8Duration = 0.5;
    CommonMethods.animatedEmojiTypeLength = 7;
    // chat UI toggle
    CommonMethods.chatUIChangeDuration = 0.5;
    // divChatHistory.style.bottom
    CommonMethods.divChatHistoryBottomChatToggleValues = [
        'calc(100px + 3em)',
        'calc(90px)'
    ];
    // selectChatPresetMsgs.style.bottom
    CommonMethods.selectChatPresetMsgsBottomChatToggleValues = [
        'calc(50px + 3em + 20px)',
        'calc(50px)'
    ];
    // btnSendChat.style.bottom
    CommonMethods.btnSendChatBottomChatToggleValues = [
        'calc(50px + 3em + 20px - 8px)',
        'calc(50px)'
    ];
    // textAreaChatMsg.style.display
    CommonMethods.textAreaChatMsgDisplayChatToggleValues = [
        'inline-block',
        'none'
    ];
    CommonMethods.emojiMsgs = [
        "这波操作，666！",
        "哈哈哈哈~~",
        "不好意思，这个没出好",
        "没事儿",
        "能不能快点啊，兵贵神速！",
        "烟花",
        "嗯，没错儿",
        "有劳点击“开始”继续游戏",
        "有劳房主暂停一下游戏",
        "不好意思，得撤了，最后一把咯",
        "谢谢大家",
        "拜拜",
        "好的",
        "Hi，大家好！",
        "不好意思，请稍等，马上回来",
    ];
    CommonMethods.emojiIndexToKeyCodes = [
        49,
        50,
        51,
        52,
        53,
        54,
        55,
        56,
        57,
        76,
        84,
        66,
        79,
        72,
        77,
    ];
    CommonMethods.emojiKeyCodeToIndex = {
        "49": 0,
        "50": 1,
        "51": 2,
        "52": 3,
        "53": 4,
        "54": 5,
        "55": 6,
        "56": 7,
        "57": 8,
        "76": 9,
        "84": 10,
        "66": 11,
        "79": 12,
        "72": 13,
        "77": 14,
    };
    CommonMethods.emojiWarningIntervalInSec = 3;
    CommonMethods.emojiWarningMsg = "请不要过于频繁发送消息，每条消息间隔".concat(CommonMethods.emojiWarningIntervalInSec, "秒");
    CommonMethods.hiddenEffectsWarningMsg = "隐藏技正在进行中，请稍后再试";
    CommonMethods.nickNameOverridePassLength = 5;
    CommonMethods.cookieExpireInDays = 3650;
    CommonMethods.recoverLoginPassFlag = "RecoverLoginPass";
    CommonMethods.loginSuccessFlag = "LoginSuccess";
    CommonMethods.qiangliangkaCost = 3;
    CommonMethods.sendBroadcastPrefix = "@all";
    CommonMethods.sendBroadcastCost = 3;
    CommonMethods.buyNoDongtuUntilCost = 0;
    CommonMethods.chatMessageCost = 0;
    CommonMethods.defaultSkinInUse = "skin_questionmark";
    CommonMethods.audioLiangpai = "liangpai";
    CommonMethods.audioShuaicuo = "shuaicuo";
    CommonMethods.audioRecoverhp = "audioRecoverhp";
    CommonMethods.audioDraw = "audiodraw";
    CommonMethods.audioDrawx = "audiodrawx";
    CommonMethods.audioTie = "audiotie";
    CommonMethods.audioWin = "audiowin";
    CommonMethods.audioGameStart = "audioGameStart";
    CommonMethods.audioEnterHall = "audioEnterHall";
    CommonMethods.audioEnterRoom = "audioEnterRoom";
    CommonMethods.audioCountdown8Sec = "audioCountdown8Sec";
    CommonMethods.NotifyStateType_ObservePlayerById = "ObservePlayerById";
    CommonMethods.classIsSuiteAvail = "classIsSuiteAvail";
    CommonMethods.classCardProcessed = "classCardProcessed";
    CommonMethods.cardTiltHeight = 30;
    CommonMethods.cardBackIndex = 54;
    return CommonMethods;
}());
