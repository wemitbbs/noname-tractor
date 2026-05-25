import { CommonMethods } from "./common_methods.js";
var RoomSetting = /** @class */ (function () {
    function RoomSetting() {
        this.RoomName = "";
        this.RoomOwner = "";
        this.ManditoryRanks = [];
        this.AllowRiotWithTooFewScoreCards = -1;
        this.AllowRiotWithTooFewTrumpCards = -1;
        this.AllowJToBottom = false;
        this.AllowSurrender = false;
        this.AllowRobotMakeTrump = false;
        this.IsFullDebug = false;
        this.secondsToWaitForReenter = 60;
        this.secondsToShowCards = 0;
        this.secondsToShowCardsPrev = 0;
        this.secondsToDiscardCards = 0;
        this.DisplaySignalCardInfo = false;
        this.IsGameCasual = 0;
        this.HideOverridingFlag = false;
        this.RandomTeamUp = false;
        this.EnableChat = true;
        this.AllowObserverChat = false;
    }
    RoomSetting.prototype.CloneFrom = function (from) {
        this.RoomName = from.RoomName;
        this.RoomOwner = from.RoomOwner;
        this.ManditoryRanks = CommonMethods.deepCopy(from.ManditoryRanks);
        this.AllowRiotWithTooFewScoreCards = from.AllowRiotWithTooFewScoreCards;
        this.AllowRiotWithTooFewTrumpCards = from.AllowRiotWithTooFewTrumpCards;
        this.AllowJToBottom = from.AllowJToBottom;
        this.AllowSurrender = from.AllowSurrender;
        this.AllowRobotMakeTrump = from.AllowRobotMakeTrump;
        this.IsFullDebug = from.IsFullDebug;
        this.secondsToWaitForReenter = from.secondsToWaitForReenter;
        this.secondsToShowCards = from.secondsToShowCards;
        this.secondsToShowCardsPrev = from.secondsToShowCardsPrev;
        this.secondsToDiscardCards = from.secondsToDiscardCards;
        this.DisplaySignalCardInfo = from.DisplaySignalCardInfo;
        this.IsGameCasual = from.IsGameCasual;
        this.HideOverridingFlag = from.HideOverridingFlag;
        this.RandomTeamUp = from.RandomTeamUp;
        this.EnableChat = from.EnableChat;
        this.AllowObserverChat = from.AllowObserverChat;
    };
    return RoomSetting;
}());
export { RoomSetting };
