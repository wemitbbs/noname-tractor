import { CurrentPoker } from './current_poker.js';
import { CommonMethods } from './common_methods.js';
import { TrumpState } from './trump_state.js';

var CurrentHandState = /** @class */ (function () {
    function CurrentHandState(gameState) {
        var _this = this;
        if (gameState != null) {
            this.PlayerHoldingCards = {};
            gameState.Players.forEach(function (p) {
                if (p != null) {
                    _this.PlayerHoldingCards[p.PlayerId] = new CurrentPoker();
                }
            });
        }
        this.LeftCardsCount = 25;
        this.Id = "";
        this.PlayerHoldingCards = {};
        this.LastTrumpStates = [];
        this.ScoreCards = [];
        this.Starter = "";
        this.Last8Holder = "";
        this.Rank = 0;
        this.Trump = 0;
        this.TrumpExposingPoker = 0;
        this.TrumpMaker = "";
        this.IsNoTrumpMaker = false;
        this.CurrentHandStep = 0;
        this.IsFirstHand = false;
        this.DiscardedCards = [];
        this.Score = 0;
        this.ScoreLast8CardsBase = 0;
        this.ScoreLast8CardsMultiplier = 0;
        this.ScorePunishment = 0;
        this.InitialRealCount = 0; // 核心补充
    }
    CurrentHandState.prototype.CloneFrom = function (from) {
        var _this = this;
        this.Id = from.Id;
        this.PlayerHoldingCards = CommonMethods.deepCopy(from.PlayerHoldingCards);
        this.LastTrumpStates = [];
        if (from.LastTrumpStates) {
            from.LastTrumpStates.forEach(function (fromtemp) {
                var temp = new TrumpState();
                temp.CloneFrom(fromtemp);
                _this.LastTrumpStates.push(temp);
            });
        }
        this.ScoreCards = from.ScoreCards;
        this.Starter = from.Starter;
        this.Last8Holder = from.Last8Holder;
        this.Rank = from.Rank;
        this.Trump = from.Trump;
        this.TrumpExposingPoker = from.TrumpExposingPoker;
        this.TrumpMaker = from.TrumpMaker;
        this.IsNoTrumpMaker = from.IsNoTrumpMaker;
        this.CurrentHandStep = from.CurrentHandStep;
        this.IsFirstHand = from.IsFirstHand;
        this.DiscardedCards = CommonMethods.deepCopy(from.DiscardedCards);
        this.Score = from.Score;
        this.ScoreLast8CardsBase = from.ScoreLast8CardsBase;
        this.ScoreLast8CardsMultiplier = from.ScoreLast8CardsMultiplier;
        this.ScorePunishment = from.ScorePunishment;
        this.LeftCardsCount = from.LeftCardsCount;
        this.InitialRealCount = from.InitialRealCount; // 核心同步
    };
    return CurrentHandState;
}());
export { CurrentHandState };
