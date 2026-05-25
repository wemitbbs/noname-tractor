import { CurrentPoker } from './current_poker.js';
import { CommonMethods } from './common_methods.js';
import { SuitEnums } from './suit_enums.js';
import { TractorRules } from './tractor_rules.js';
import { ShowingCardsValidationResult } from './showing_cards_validation_result.js';
import { PokerHelper } from './poker_helper.js';
import { EmojiUtil } from './emoji_util.js';
var CardsReady_REQUEST = "CardsReady";
var DrawingFormHelper = /** @class */ (function () {
    function DrawingFormHelper(mf) {
        this.startX = "";
        this.startY = "";
        this.handcardScale = 1;
        this.handcardPosition = 1;
        this.isMouseDown = false;
        this.skipCheckCardImages = false;
        this.mainForm = mf;
        this.suitSequence = 0;
    }
    DrawingFormHelper.prototype.IGetCard = function (cardNumber) {
        this.skipCheckCardImages = true;
        // this.destroyAllCards()
        this.resetAllCards();
        this.DrawHandCardsByPosition(1, this.mainForm.tractorPlayer.CurrentPoker, 1, SuitEnums.Suit.Joker);
        var skipDestroy = (cardNumber !== 53 || this.mainForm.tractorPlayer.CurrentPoker.RedJoker() !== 2);
        this.reDrawToolbar(skipDestroy);
    };
    // drawing cards without any tilt
    DrawingFormHelper.prototype.ResortMyHandCards = function (destroy) {
        this.skipCheckCardImages = false;
        this.mainForm.myCardIsReady = Array(33).fill(false);
        if (destroy) {
            this.destroyAllCards();
        }
        else {
            this.resetAllCards();
        }
        this.DrawHandCardsByPosition(1, this.mainForm.tractorPlayer.CurrentPoker, 1);
    };
    // drawing cards with selected cards tilted
    DrawingFormHelper.prototype.DrawMyPlayingCards = function () {
        this.skipCheckCardImages = true;
        this.DrawScoreImageAndCards();
        // this.destroyAllCards()
        this.resetAllCards();
        this.DrawHandCardsByPosition(1, this.mainForm.tractorPlayer.CurrentPoker, 1);
        this.validateSelectedCards();
    };
    DrawingFormHelper.prototype.validateSelectedCards = function () {
        if (this.mainForm.tractorPlayer.isObserver)
            return;
        this.mainForm.SelectedCards = [];
        for (var k = 0; k < this.mainForm.myCardIsReady.length; k++) {
            if (this.mainForm.myCardIsReady[k]) {
                this.mainForm.SelectedCards.push(parseInt(this.mainForm.gameScene.cardImages[k].getAttribute("serverCardNumber")));
            }
        }
        //判断当前的出的牌是否有效,如果有效，画小猪
        if (this.mainForm.SelectedCards.length > 0) {
            var selectedCardsValidationResult = TractorRules.IsValid(this.mainForm.tractorPlayer.CurrentTrickState, this.mainForm.SelectedCards, this.mainForm.tractorPlayer.CurrentPoker);
            if ((this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Playing
                && this.mainForm.tractorPlayer.CurrentTrickState.NextPlayer() == this.mainForm.tractorPlayer.PlayerId)
                &&
                    (selectedCardsValidationResult.ResultType == ShowingCardsValidationResult.ShowingCardsValidationResultType.Valid ||
                        selectedCardsValidationResult.ResultType == ShowingCardsValidationResult.ShowingCardsValidationResultType.TryToDump)) {
                if (this.mainForm.gameScene.ui.btnPig && !this.mainForm.gameScene.ui.btnPig.classList.contains('hidden')) {
                    this.mainForm.gameScene.ui.btnPig.classList.remove('disabled');
                    this.mainForm.gameScene.ui.btnPig.classList.add('pointerdiv');
                }
            }
            else if ((this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Playing
                && this.mainForm.tractorPlayer.CurrentTrickState.NextPlayer() == this.mainForm.tractorPlayer.PlayerId)) {
                this.mainForm.gameScene.ui.btnPig.classList.add('disabled');
                this.mainForm.gameScene.ui.btnPig.classList.remove('pointerdiv');
            }
        }
        else if ((this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Playing
            && this.mainForm.tractorPlayer.CurrentTrickState.NextPlayer() == this.mainForm.tractorPlayer.PlayerId)) {
            this.mainForm.gameScene.ui.btnPig.classList.add('disabled');
            this.mainForm.gameScene.ui.btnPig.classList.remove('pointerdiv');
        }
        this.My8CardsIsReady();
    };
    DrawingFormHelper.prototype.My8CardsIsReady = function () {
        if (this.mainForm.tractorPlayer.isObserver)
            return;
        //如果等我扣牌
        if (this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8Cards && this.mainForm.tractorPlayer.CurrentHandState.Last8Holder == this.mainForm.tractorPlayer.PlayerId) {
            var total = 0;
            for (var i = 0; i < this.mainForm.myCardIsReady.length; i++) {
                if (this.mainForm.myCardIsReady[i]) {
                    total++;
                }
            }
            if (total == 8) {
                this.mainForm.gameScene.ui.btnPig.classList.remove('disabled');
                this.mainForm.gameScene.ui.btnPig.classList.add('pointerdiv');
            }
            else {
                this.mainForm.gameScene.ui.btnPig.classList.add('disabled');
                this.mainForm.gameScene.ui.btnPig.classList.remove('pointerdiv');
            }
        }
    };
    // playerPos: 1-4
    DrawingFormHelper.prototype.DrawHandCardsByPosition = function (playerPos, currentPoker, hcs, curTrump) {
        this.handcardPosition = playerPos;
        var cardCount = currentPoker.Count();
        this.handcardScale = hcs;
        var posIndex = playerPos - 1;
        this.startX = this.mainForm.gameScene.coordinates.handCardPositions[posIndex].x;
        var numOfSuits = CommonMethods.getNumOfSuits(currentPoker);
        if (posIndex == 0) {
            this.startX = "".concat(this.startX, " - ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale / 2 * (cardCount - 1), "px - ").concat((numOfSuits - 1) * this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale / 2, "px");
        }
        else if (posIndex == 1 || posIndex == 2) {
            this.startX = "".concat(this.startX, " + ").concat((this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale * (cardCount - 1) + (numOfSuits - 1) * this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale), "px");
        }
        this.startY = this.mainForm.gameScene.coordinates.handCardPositions[posIndex].y;
        var allHeartsNoRank = currentPoker.HeartsNoRank();
        var allSpadesNoRank = currentPoker.SpadesNoRank();
        var allDiamondsNoRank = currentPoker.DiamondsNoRank();
        var allClubsNoRank = currentPoker.ClubsNoRank();
        if (!curTrump)
            curTrump = this.mainForm.tractorPlayer.CurrentHandState.Trump;
        var subSolidMasters = [];
        if (curTrump != SuitEnums.Suit.Heart)
            subSolidMasters[currentPoker.Rank] = currentPoker.HeartsRankTotal();
        if (curTrump != SuitEnums.Suit.Spade)
            subSolidMasters[currentPoker.Rank + 13] = currentPoker.SpadesRankTotal();
        if (curTrump != SuitEnums.Suit.Diamond)
            subSolidMasters[currentPoker.Rank + 26] = currentPoker.DiamondsRankTotal();
        if (curTrump != SuitEnums.Suit.Club)
            subSolidMasters[currentPoker.Rank + 39] = currentPoker.ClubsRankTotal();
        var didDrawMaster = false;
        var primeSolidMasters = [];
        if (curTrump == SuitEnums.Suit.Heart) { //红桃
            this.DrawCardsBySuit(allSpadesNoRank, 13, true);
            this.DrawCardsBySuit(allDiamondsNoRank, 26, true);
            this.DrawCardsBySuit(allClubsNoRank, 39, true);
            if (this.DrawCardsBySuit(allHeartsNoRank, 0, true)) {
                if (this.handcardPosition === 2 || this.handcardPosition === 3) {
                    this.startX = "".concat(this.startX, " + ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
                }
                else {
                    this.startX = "".concat(this.startX, " - ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
                }
                didDrawMaster = true;
            }
            primeSolidMasters[currentPoker.Rank] = currentPoker.HeartsRankTotal();
        }
        else if (curTrump == SuitEnums.Suit.Spade) { //黑桃
            this.DrawCardsBySuit(allDiamondsNoRank, 26, true);
            this.DrawCardsBySuit(allClubsNoRank, 39, true);
            this.DrawCardsBySuit(allHeartsNoRank, 0, true);
            if (this.DrawCardsBySuit(allSpadesNoRank, 13, true)) {
                if (this.handcardPosition === 2 || this.handcardPosition === 3) {
                    this.startX = "".concat(this.startX, " + ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
                }
                else {
                    this.startX = "".concat(this.startX, " - ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
                }
                didDrawMaster = true;
            }
            primeSolidMasters[currentPoker.Rank + 13] = currentPoker.SpadesRankTotal();
        }
        else if (curTrump == SuitEnums.Suit.Diamond) { //方片
            this.DrawCardsBySuit(allClubsNoRank, 39, true);
            this.DrawCardsBySuit(allHeartsNoRank, 0, true);
            this.DrawCardsBySuit(allSpadesNoRank, 13, true);
            if (this.DrawCardsBySuit(allDiamondsNoRank, 26, true)) {
                if (this.handcardPosition === 2 || this.handcardPosition === 3) {
                    this.startX = "".concat(this.startX, " + ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
                }
                else {
                    this.startX = "".concat(this.startX, " - ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
                }
                didDrawMaster = true;
            }
            primeSolidMasters[currentPoker.Rank + 26] = currentPoker.DiamondsRankTotal();
        }
        else if (curTrump == SuitEnums.Suit.Club) { //草花
            this.DrawCardsBySuit(allHeartsNoRank, 0, true);
            this.DrawCardsBySuit(allSpadesNoRank, 13, true);
            this.DrawCardsBySuit(allDiamondsNoRank, 26, true);
            if (this.DrawCardsBySuit(allClubsNoRank, 39, true)) {
                if (this.handcardPosition === 2 || this.handcardPosition === 3) {
                    this.startX = "".concat(this.startX, " + ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
                }
                else {
                    this.startX = "".concat(this.startX, " - ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
                }
                didDrawMaster = true;
            }
            primeSolidMasters[currentPoker.Rank + 39] = currentPoker.ClubsRankTotal();
        }
        else { //无主
            this.DrawCardsBySuit(allHeartsNoRank, 0, true);
            this.DrawCardsBySuit(allSpadesNoRank, 13, true);
            this.DrawCardsBySuit(allDiamondsNoRank, 26, true);
            this.DrawCardsBySuit(allClubsNoRank, 39, true);
        }
        primeSolidMasters[52] = currentPoker.Cards[52];
        primeSolidMasters[53] = currentPoker.Cards[53];
        if (this.DrawCardsBySuit(subSolidMasters, 0, !didDrawMaster)) {
            if (this.handcardPosition === 2 || this.handcardPosition === 3) {
                this.startX = "".concat(this.startX, " + ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
            }
            else {
                this.startX = "".concat(this.startX, " - ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
            }
            didDrawMaster = true;
        }
        this.DrawCardsBySuit(primeSolidMasters, 0, !didDrawMaster);
    };
    DrawingFormHelper.prototype.DrawCardsBySuit = function (cardsToDraw, offset, resetSuitSequence) {
        if (resetSuitSequence)
            this.suitSequence = 1;
        var hasDrawn = false;
        for (var i = 0; i < cardsToDraw.length; i++) {
            var cardCount = cardsToDraw[i];
            for (var j = 0; j < cardCount; j++) {
                this.drawCard(this.startX, this.startY, i + offset);
                if (this.handcardPosition === 2 || this.handcardPosition === 3) {
                    this.startX = "".concat(this.startX, " - ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
                }
                else {
                    this.startX = "".concat(this.startX, " + ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
                }
                hasDrawn = true;
            }
        }
        if (hasDrawn) {
            if (this.handcardPosition === 2 || this.handcardPosition === 3) {
                this.startX = "".concat(this.startX, " - ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
            }
            else {
                this.startX = "".concat(this.startX, " + ").concat(this.mainForm.gameScene.coordinates.handCardOffset * this.handcardScale, "px");
            }
        }
        return hasDrawn;
    };
    DrawingFormHelper.prototype.DrawShowedCards = function (serverCardList, x, y, targetImages, scale, pos, skipXUpdate) {
        // 5 - last 8 cards
        // 6 - score cards
        // 7 - DrawTrumpMadeCardsByPositionFromLastTrick for pos 3
        if (pos === 2 || pos === 5 || pos === 7) {
            this.DrawShowedCardsReverse(serverCardList, x, y, targetImages, scale, pos);
            return;
        }
        if (!skipXUpdate && (pos === 1 || pos === 3)) {
            x = "".concat(x, " - ").concat(this.mainForm.gameScene.coordinates.handCardOffset * scale * (serverCardList.length - 1) / 2, "px");
        }
        for (var i = 0; i < serverCardList.length; i++) {
            var uiCardNumber = CommonMethods.ServerToUICardMap[serverCardList[i]];
            var image = this.createCard(this.mainForm.gameScene.ui.frameGameRoom, uiCardNumber, scale);
            image.setAttribute('serverCardNumber', serverCardList[i]);
            switch (pos) {
                case 1:
                    image.style.left = "calc(".concat(x, ")");
                    image.style.bottom = "calc(".concat(y, ")");
                    break;
                case 3:
                case 6:
                    image.style.left = "calc(".concat(x, ")");
                    image.style.top = "calc(".concat(y, ")");
                    break;
                case 4:
                    image.style.left = "calc(".concat(x, ")");
                    image.style.bottom = "calc(".concat(y, ")");
                    break;
                default:
                    break;
            }
            targetImages.push(image);
            x = "".concat(x, " + ").concat(this.mainForm.gameScene.coordinates.handCardOffset * scale, "px");
        }
    };
    DrawingFormHelper.prototype.DrawShowedCardsReverse = function (serverCardList, x, y, targetImages, scale, pos) {
        x = "".concat(x, " + ").concat(this.mainForm.gameScene.coordinates.handCardOffset * scale * (serverCardList.length - 1), "px");
        for (var i = 0; i < serverCardList.length; i++) {
            var uiCardNumber = CommonMethods.ServerToUICardMap[serverCardList[i]];
            var image = this.createCard(this.mainForm.gameScene.ui.frameGameRoom, uiCardNumber, scale);
            image.setAttribute('serverCardNumber', serverCardList[i]);
            switch (pos) {
                case 2:
                    image.style.right = "calc(".concat(x, ")");
                    image.style.bottom = "calc(".concat(y, ")");
                    break;
                case 5:
                case 7:
                    image.style.right = "calc(".concat(x, ")");
                    image.style.top = "calc(".concat(y, ")");
                    break;
                default:
                    break;
            }
            targetImages.push(image);
            x = "".concat(x, " - ").concat(this.mainForm.gameScene.coordinates.handCardOffset * scale, "px");
        }
    };
    DrawingFormHelper.prototype.drawCard = function (x, y, serverCardNumber) {
        var _this = this;
        var image = undefined;
        var tempImages = this.mainForm.gameScene.cardServerNumToImage[serverCardNumber];
        if (tempImages && tempImages.length > 0) {
            for (var i = 0; i < tempImages.length; i++) {
                var tempImage = tempImages[i];
                if (tempImage.classList.contains(CommonMethods.classCardProcessed))
                    continue;
                image = tempImage;
                break;
            }
        }
        var parent = this.mainForm.gameScene.ui.frameGameRoom;
        if (this.handcardPosition === 1)
            parent = this.mainForm.gameScene.ui.handZone;
        var isAnimation = false;
        if (!image) {
            // 未在已画牌中，则需画牌
            var uiCardNumber = CommonMethods.ServerToUICardMap[serverCardNumber];
            isAnimation = this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep === SuitEnums.HandStep.DistributingCards;
            image = this.createCard(parent, uiCardNumber, this.handcardScale, x, y);
            image.setAttribute('cardsOrderNumber', this.mainForm.cardsOrderNumber);
            image.setAttribute('serverCardNumber', serverCardNumber);
            image.node.seqnum.style.position = "absolute";
            image.node.seqnum.style.left = "calc(1px)";
            image.node.seqnum.style.top = "calc(65%)";
            image.node.seqnum.style.fontSize = "".concat(15 * this.handcardScale, "px");
            image.node.seqnum.style.color = 'gray';
            image.node.seqnum.style['font-family'] = 'serif';
            image.node.seqnum.style['text-shadow'] = 'none';
            this.mainForm.gameScene.cardImages.splice(this.mainForm.cardsOrderNumber, 0, image);
            image.classList.add(CommonMethods.classCardProcessed);
            this.mainForm.gameScene.cardServerNumToImage[serverCardNumber].push(image);
            if (this.mainForm.myCardIsReady[this.mainForm.cardsOrderNumber] === undefined) {
                this.mainForm.myCardIsReady[this.mainForm.cardsOrderNumber] = false;
            }
            if (!this.mainForm.gameScene.isReplayMode) {
                if (!this.mainForm.tractorPlayer.isObserver) {
                    if (this.mainForm.gameScene.noTouchDevice.toLowerCase() !== "true" && CommonMethods.isTouchDevice()) {
                        // touch device
                        image.node.cover.addEventListener("touchstart", function (e) {
                            _this.handleSelectingCard(image);
                            _this.isMouseDown = true;
                            _this.isDragging = image;
                        });
                        image.addEventListener("touchend", function (e) {
                            _this.isMouseDown = false;
                            _this.isDragging = undefined;
                        });
                        image.node.cover.addEventListener("touchmove", function (e) {
                            var coverTouched = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
                            if (coverTouched && coverTouched.classList.contains('cover')) {
                                var cardTouched = coverTouched.parentElement;
                                if (cardTouched.classList.contains('tractorCard')) {
                                    if (_this.mainForm.gameScene.yesDragSelect.toLowerCase() === "true" && _this.isDragging !== cardTouched && _this.isMouseDown) {
                                        _this.handleSelectingCard(cardTouched);
                                        _this.isDragging = cardTouched;
                                    }
                                }
                            }
                        });
                    }
                    else {
                        // left click
                        image.node.cover.addEventListener("mousedown", function (e) {
                            if (e.button === 0) {
                                _this.handleSelectingCard(image);
                                _this.isMouseDown = true;
                                _this.isDragging = image;
                            }
                        });
                        image.addEventListener("mouseup", function (e) {
                            _this.isMouseDown = false;
                            _this.isDragging = undefined;
                        });
                        image.node.cover.addEventListener("mouseover", function (e) {
                            if (_this.mainForm.gameScene.yesDragSelect.toLowerCase() === "true" && e.button === 0 && _this.isDragging !== image && _this.isMouseDown) {
                                _this.handleSelectingCard(image);
                            }
                        });
                        // right click
                        image.node.cover.addEventListener("mousedown", function (e) {
                            if (e.button === 2) {
                                _this.handleSelectingCardRightClick(image);
                            }
                        });
                    }
                }
            }
        }
        var trumpMadeCard = (this.mainForm.tractorPlayer.CurrentHandState.Trump - 1) * 13 + this.mainForm.tractorPlayer.CurrentHandState.Rank;
        switch (this.handcardPosition) {
            case 1:
                if (!isAnimation || this.mainForm.gameScene.isReplayMode) {
                    image.style.left = "calc(".concat(x, ")");
                    image.style.bottom = "calc(".concat(y, ")");
                    image.style.opacity = 1;
                }
                break;
            case 2:
                image.style.right = "calc(".concat(x, ")");
                image.style.bottom = "calc(".concat(y, ")");
                break;
            case 3:
                image.style.right = "calc(".concat(x, ")");
                image.style.top = "calc(".concat(y, ")");
                break;
            case 4:
                image.style.left = "calc(".concat(x, ")");
                image.style.bottom = "calc(".concat(y, ")");
                break;
            default:
                break;
        }
        if (!this.skipCheckCardImages) {
            var prevOrderNum = parseInt(image.getAttribute('cardsOrderNumber'));
            if (prevOrderNum !== this.mainForm.cardsOrderNumber) {
                if (this.mainForm.gameScene.cardImages[prevOrderNum]) {
                    this.swapCardImage(prevOrderNum, this.mainForm.cardsOrderNumber);
                    if (parent === this.mainForm.gameScene.ui.handZone && parent.childNodes.length > this.mainForm.cardsOrderNumber) {
                        parent.insertBefore(image, parent.childNodes[this.mainForm.cardsOrderNumber]);
                    }
                    else {
                        parent.appendChild(image);
                    }
                }
            }
        }
        image.setAttribute('cardsOrderNumber', this.mainForm.cardsOrderNumber);
        image.node.seqnum.innerHTML = "".concat(this.suitSequence);
        image.classList.add(CommonMethods.classCardProcessed);
        this.suitSequence++;
        if (this.mainForm.gameScene.isReplayMode) {
            this.mainForm.cardsOrderNumber++;
            return;
        }
        // if I made trump, move it up by 30px
        if (this.mainForm.tractorPlayer.CurrentHandState.TrumpExposingPoker == SuitEnums.TrumpExposingPoker.PairBlackJoker)
            trumpMadeCard = 52;
        else if (this.mainForm.tractorPlayer.CurrentHandState.TrumpExposingPoker == SuitEnums.TrumpExposingPoker.PairRedJoker)
            trumpMadeCard = 53;
        if (this.mainForm.tractorPlayer.CurrentHandState.TrumpMaker == this.mainForm.tractorPlayer.PlayerId &&
            trumpMadeCard == serverCardNumber &&
            (this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DistributingCards || this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DistributingCardsFinished)) {
            if (this.mainForm.tractorPlayer.CurrentHandState.TrumpExposingPoker > SuitEnums.TrumpExposingPoker.SingleRank) {
                image.style.transform = "translate(0px, -".concat(CommonMethods.cardTiltHeight, "px)");
                image.setAttribute('status', "up");
            }
            else {
                var lifted = false;
                for (var i = 0; i < this.mainForm.gameScene.cardImages.length; i++) {
                    if (this.mainForm.gameScene.cardImages[i].getAttribute('status') === 'up') {
                        lifted = true;
                        break;
                    }
                }
                if (!lifted) {
                    image.style.transform = "translate(0px, -".concat(CommonMethods.cardTiltHeight, "px)");
                    image.setAttribute('status', "up");
                }
            }
        }
        if (this.mainForm.tractorPlayer.CurrentHandState.TrumpMaker == this.mainForm.tractorPlayer.PlayerId &&
            trumpMadeCard == serverCardNumber &&
            this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep > SuitEnums.HandStep.DistributingCardsFinished) {
            image.setAttribute("status", "down");
            image.style.transform = 'unset';
        }
        if ((this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8Cards || this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Playing) &&
            this.mainForm.myCardIsReady[this.mainForm.cardsOrderNumber] &&
            (image.data === null || !image.getAttribute('status') || image.getAttribute('status') === "down")) {
            image.style.transform = "translate(0px, -".concat(CommonMethods.cardTiltHeight, "px)");
            image.setAttribute('status', "up");
        }
        if ((this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8Cards || this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Playing) &&
            !this.mainForm.myCardIsReady[this.mainForm.cardsOrderNumber] &&
            (image.data !== null && image.getAttribute('status') && image.getAttribute('status') === "up")) {
            image.setAttribute("status", "down");
            image.style.transform = 'unset';
        }
        this.mainForm.cardsOrderNumber++;
    };
    DrawingFormHelper.prototype.swapCardImage = function (prevOrderNum, curOrderNum) {
        var prevImg = this.mainForm.gameScene.cardImages[prevOrderNum];
        var curImg = this.mainForm.gameScene.cardImages[curOrderNum];
        this.mainForm.gameScene.cardImages[prevOrderNum] = curImg;
        this.mainForm.gameScene.cardImages[curOrderNum] = prevImg;
        prevImg.setAttribute('cardsOrderNumber', curOrderNum);
        curImg.setAttribute('cardsOrderNumber', prevOrderNum);
    };
    DrawingFormHelper.prototype.removeCardImage = function (serverCardNumbers) {
        // 是出牌，则需删除牌
        var indicesToRemove = [];
        for (var i = 0; i < serverCardNumbers.length; i++) {
            var serverCardNumber = serverCardNumbers[i];
            var removedCardImageIndex = -1;
            for (var i_1 = 0; i_1 < this.mainForm.gameScene.cardServerNumToImage[serverCardNumber].length; i_1++) {
                var tempImage = this.mainForm.gameScene.cardServerNumToImage[serverCardNumber][i_1];
                if (tempImage.getAttribute('status') === 'up' ||
                    (this.mainForm.tractorPlayer.playerLocalCache.isLastTrick || this.mainForm.IsDebug) && !this.mainForm.tractorPlayer.isObserver) {
                    removedCardImageIndex = i_1;
                    break;
                }
            }
            var removedCardImage = void 0;
            switch (removedCardImageIndex) {
                case 1:
                    removedCardImage = this.mainForm.gameScene.cardServerNumToImage[serverCardNumber].pop();
                    break;
                default:
                    removedCardImage = this.mainForm.gameScene.cardServerNumToImage[serverCardNumber].shift();
                    break;
            }
            if (removedCardImage) {
                var cardsOrderNumber = parseInt(removedCardImage.getAttribute('cardsOrderNumber'));
                indicesToRemove.push(cardsOrderNumber);
                removedCardImage.remove();
            }
        }
        var newCIs = [];
        for (var i = 0; i < this.mainForm.gameScene.cardImages.length; i++) {
            if (indicesToRemove.includes(i))
                continue;
            newCIs.push(this.mainForm.gameScene.cardImages[i]);
        }
        this.mainForm.gameScene.cardImages = newCIs;
    };
    DrawingFormHelper.prototype.createCard = function (position, uiCardNumber, hcs, x, y) {
        var tractorCard = this.mainForm.gameScene.ui.create.div('.tractorCard');
        if (position === this.mainForm.gameScene.ui.handZone && position.childNodes.length > this.mainForm.cardsOrderNumber) {
            position.insertBefore(tractorCard, position.childNodes[this.mainForm.cardsOrderNumber]);
        }
        else {
            position.appendChild(tractorCard);
        }
        if (position === this.mainForm.gameScene.ui.handZone && x !== undefined && y !== undefined) {
            tractorCard.style.left = "calc(".concat(x, ")");
            tractorCard.style.bottom = "calc(".concat(CommonMethods.cardTiltHeight, "px)");
            tractorCard.style.opacity = 0.1;
            setTimeout(function () {
                tractorCard.style.left = "calc(".concat(x, ")");
                tractorCard.style.bottom = "calc(".concat(y, ")");
                tractorCard.style.opacity = 1;
            }, 100);
        }
        tractorCard.node = {
            seqnum: this.mainForm.gameScene.ui.create.div('.seqnum', tractorCard),
            cover: this.mainForm.gameScene.ui.create.div('.cover', tractorCard),
        };
        var cardsStyle = this.mainForm.gameScene.useCardUIStyleClassic ? "cardsclassic" : "cards";
        if (this.mainForm.gameScene.ui.storageFileForImages.hasOwnProperty("".concat(cardsStyle).concat(uiCardNumber))) {
            tractorCard.setBackgroundImage(this.mainForm.gameScene.ui.storageFileForImages["".concat(cardsStyle).concat(uiCardNumber)]);
        }
        else {
            tractorCard.setBackgroundImage("image/tractor/".concat(cardsStyle, "/tile0").concat(uiCardNumber.toString().padStart(2, '0'), ".png"));
        }
        tractorCard.style['background-size'] = '100% 100%';
        tractorCard.style['background-repeat'] = 'no-repeat';
        tractorCard.style.width = "".concat(this.mainForm.gameScene.coordinates.cardWidth * hcs, "px");
        tractorCard.style.height = "".concat(this.mainForm.gameScene.coordinates.cardHeight * hcs, "px");
        tractorCard.node.cover.style.width = "100%";
        tractorCard.node.cover.style.height = "100%";
        return tractorCard;
    };
    DrawingFormHelper.prototype.handleSelectingCard = function (image) {
        if (!(this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Playing ||
            this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8Cards)) {
            return;
        }
        if (!image || !image.getAttribute("status") || image.getAttribute("status") === "down") {
            image.setAttribute("status", "up");
            image.style.transform = "translate(0px, -".concat(CommonMethods.cardTiltHeight, "px)");
            this.mainForm.myCardIsReady[parseInt(image.getAttribute("cardsOrderNumber"))] = true;
            this.mainForm.gameScene.sendMessageToServer(CardsReady_REQUEST, this.mainForm.tractorPlayer.MyOwnId, JSON.stringify(this.mainForm.myCardIsReady));
            this.validateSelectedCards();
        }
        else {
            image.setAttribute("status", "down");
            image.style.transform = 'unset';
            this.mainForm.myCardIsReady[parseInt(image.getAttribute("cardsOrderNumber"))] = false;
            this.mainForm.gameScene.sendMessageToServer(CardsReady_REQUEST, this.mainForm.tractorPlayer.MyOwnId, JSON.stringify(this.mainForm.myCardIsReady));
            this.validateSelectedCards();
        }
    };
    DrawingFormHelper.prototype.handleSelectingCardRightClick = function (image) {
        var _this = this;
        if (!(this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.Playing ||
            this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8Cards)) {
            return;
        }
        //统计已选中的牌张数
        var readyCount = 0;
        var crlength = this.mainForm.myCardIsReady.length;
        for (var ri = 0; ri < crlength; ri++) {
            if (this.mainForm.myCardIsReady[ri])
                readyCount++;
        }
        var showingCardsCp = new CurrentPoker();
        showingCardsCp.Trump = this.mainForm.tractorPlayer.CurrentHandState.Trump;
        showingCardsCp.Rank = this.mainForm.tractorPlayer.CurrentHandState.Rank;
        var i = parseInt(image.getAttribute("cardsOrderNumber"));
        var b = this.mainForm.myCardIsReady[i];
        this.mainForm.myCardIsReady[i] = !b;
        var clickedCardNumber = parseInt(image.getAttribute("serverCardNumber"));
        var isClickedTrump = PokerHelper.IsTrump(clickedCardNumber, showingCardsCp.Trump, showingCardsCp.Rank);
        //响应右键的3种情况：
        //1. 首出（默认）
        var selectMoreCount = 0;
        for (var left = i - 1; left >= 0; left--) {
            var toAddImage = this.mainForm.gameScene.cardImages[left];
            var toAddCardNumber = parseInt(toAddImage.getAttribute("serverCardNumber"));
            if (PokerHelper.GetSuit(toAddCardNumber) == PokerHelper.GetSuit(clickedCardNumber) ||
                PokerHelper.IsTrump(toAddCardNumber, showingCardsCp.Trump, showingCardsCp.Rank) && isClickedTrump)
                selectMoreCount++;
            else
                break;
        }
        var isDiscardingLast8 = this.mainForm.tractorPlayer.CurrentHandState.CurrentHandStep == SuitEnums.HandStep.DiscardingLast8Cards;
        var isFollowing = this.mainForm.tractorPlayer.CurrentTrickState.IsStarted() &&
            CommonMethods.GetShowedCardsByPlayerID(this.mainForm.tractorPlayer.CurrentTrickState.ShowedCards, this.mainForm.tractorPlayer.MyOwnId).length == 0 &&
            this.mainForm.tractorPlayer.CurrentTrickState.Learder !== this.mainForm.tractorPlayer.MyOwnId;
        var isLeader = !isDiscardingLast8 && !isFollowing;
        if (isDiscardingLast8) {
            //2. 埋底牌
            selectMoreCount = Math.min(selectMoreCount, 8 - 1 - readyCount);
        }
        else if (isFollowing) {
            //3. 跟出
            selectMoreCount = Math.min(selectMoreCount, this.mainForm.tractorPlayer.CurrentTrickState.LeadingCards().length - 1 - readyCount);
        }
        if (!b) {
            var cardsToDump = [];
            var cardsToDumpCardNumber = [];
            var maxCard = showingCardsCp.Rank == 12 ? 11 : 12;
            var selectTopToDump = !isClickedTrump && clickedCardNumber % 13 == maxCard || isClickedTrump && clickedCardNumber == 53; //如果右键点的A或者大王，且满足甩多张的条件，则向左选中所有本门合理可甩的牌
            if (isLeader && selectTopToDump) {
                var singleCardFound = false;
                for (var j = 1; j <= selectMoreCount; j++) {
                    var toAddImage = this.mainForm.gameScene.cardImages[i - j];
                    var toAddCardNumber = parseInt(toAddImage.getAttribute("serverCardNumber"));
                    var toAddCardImageOnRightImage = this.mainForm.gameScene.cardImages[i - j + 1];
                    var toAddCardNumberOnRight = parseInt(toAddCardImageOnRightImage.getAttribute("serverCardNumber"));
                    //如果候选牌是同一花色
                    if (!PokerHelper.IsTrump(toAddCardNumber, showingCardsCp.Trump, showingCardsCp.Rank) && !isClickedTrump && PokerHelper.GetSuit(toAddCardNumber) == PokerHelper.GetSuit(clickedCardNumber) ||
                        PokerHelper.IsTrump(toAddCardNumber, showingCardsCp.Trump, showingCardsCp.Rank) && isClickedTrump) {
                        var isSingleCard = toAddCardNumber != toAddCardNumberOnRight;
                        if (isSingleCard) {
                            if (singleCardFound) {
                                showingCardsCp.Clear();
                                break;
                            }
                            else {
                                singleCardFound = true;
                            }
                        }
                        showingCardsCp.AddCard(toAddCardNumberOnRight);
                        cardsToDump.push(i - j + 1);
                        cardsToDumpCardNumber.push(toAddCardNumberOnRight);
                        showingCardsCp.AddCard(toAddCardNumberOnRight);
                        if (!isSingleCard) {
                            cardsToDump.push(i - j);
                            cardsToDumpCardNumber.push(toAddCardNumberOnRight);
                        }
                        if (j > 1) {
                            var tractorCount = showingCardsCp.GetTractorOfAnySuit().length;
                            var needToBreak = false;
                            while (cardsToDumpCardNumber.length > 0 && !(tractorCount > 1 && tractorCount * 2 == showingCardsCp.Count())) {
                                needToBreak = true;
                                var totalCount = cardsToDumpCardNumber.length;
                                var cardNumToDel = cardsToDumpCardNumber[cardsToDumpCardNumber.length - 1];
                                showingCardsCp.RemoveCard(cardNumToDel);
                                showingCardsCp.RemoveCard(cardNumToDel);
                                cardsToDumpCardNumber.splice(totalCount - 1, 1);
                                cardsToDump.splice(totalCount - 1, 1);
                                if (cardsToDumpCardNumber.length > 0 && cardsToDumpCardNumber[totalCount - 2] == cardNumToDel) {
                                    cardsToDumpCardNumber.splice(totalCount - 2, 1);
                                    cardsToDump.splice(totalCount - 2, 1);
                                }
                            }
                            if (needToBreak) {
                                break;
                            }
                        }
                        if (!isSingleCard) {
                            j++;
                        }
                        //特殊情况处理，最后一个单张顶张进不到下个循环，须在上轮循环处理
                        if (j == selectMoreCount && !singleCardFound) {
                            var toAddCardImageOnRightImage_1 = this.mainForm.gameScene.cardImages[i - j];
                            var toAddCardNumberOnRight_1 = parseInt(toAddCardImageOnRightImage_1.getAttribute("serverCardNumber"));
                            showingCardsCp.AddCard(toAddCardNumberOnRight_1);
                            showingCardsCp.AddCard(toAddCardNumberOnRight_1);
                            var tractorCount = showingCardsCp.GetTractorOfAnySuit().length;
                            if (tractorCount > 1 && tractorCount * 2 == showingCardsCp.Count()) {
                                cardsToDump.push(i - j);
                            }
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            if (cardsToDump.length >= 2) {
                cardsToDump.forEach(function (c) {
                    _this.mainForm.myCardIsReady[c] = !b;
                });
            }
            else {
                showingCardsCp.Clear();
                var selectAll = false; //如果右键点的散牌，则向左选中所有本门花色的牌
                for (var j = 1; j <= selectMoreCount; j++) {
                    var toAddImage = this.mainForm.gameScene.cardImages[i - j];
                    var toAddCardNumber = parseInt(toAddImage.getAttribute("serverCardNumber"));
                    var toAddCardImageOnRightImage = this.mainForm.gameScene.cardImages[i - j + 1];
                    var toAddCardNumberOnRight = parseInt(toAddCardImageOnRightImage.getAttribute("serverCardNumber"));
                    //如果候选牌是同一花色: 1. neither is trump, same suit; 2. both are trump
                    if (!PokerHelper.IsTrump(toAddCardNumber, showingCardsCp.Trump, showingCardsCp.Rank) && !isClickedTrump && PokerHelper.GetSuit(toAddCardNumber) == PokerHelper.GetSuit(clickedCardNumber) ||
                        PokerHelper.IsTrump(toAddCardNumber, showingCardsCp.Trump, showingCardsCp.Rank) && isClickedTrump) {
                        if (isLeader) {
                            //第一个出，候选牌为对子，拖拉机
                            if (!selectAll) {
                                showingCardsCp.AddCard(toAddCardNumberOnRight);
                                showingCardsCp.AddCard(toAddCardNumber);
                            }
                            if (showingCardsCp.Count() == 2 && (showingCardsCp.GetPairs().length == 1) || //如果是一对
                                ((showingCardsCp.GetTractorOfAnySuit().length > 1) &&
                                    showingCardsCp.Count() == showingCardsCp.GetTractorOfAnySuit().length * 2)) //如果是拖拉机
                             {
                                this.mainForm.myCardIsReady[i - j] = !b;
                                this.mainForm.myCardIsReady[i - j + 1] = !b;
                                j++;
                            }
                            else if (j == 1 || selectAll) {
                                selectAll = true;
                                this.mainForm.myCardIsReady[i - j] = !b;
                            }
                            else {
                                break;
                            }
                        }
                        else {
                            //埋底或者跟出
                            this.mainForm.myCardIsReady[i - j] = !b;
                        }
                    }
                    else {
                        break;
                    }
                }
            }
        }
        else {
            for (var j = 1; j <= i; j++) {
                var toAddImage = this.mainForm.gameScene.cardImages[i - j];
                var toAddCardNumber = parseInt(toAddImage.getAttribute("serverCardNumber"));
                var toAddCardImageOnRightImage = this.mainForm.gameScene.cardImages[i - j + 1];
                var toAddCardNumberOnRight = parseInt(toAddCardImageOnRightImage.getAttribute("serverCardNumber"));
                //如果候选牌是同一花色
                if (PokerHelper.GetSuit(toAddCardNumber) == PokerHelper.GetSuit(clickedCardNumber) ||
                    PokerHelper.IsTrump(toAddCardNumber, showingCardsCp.Trump, showingCardsCp.Rank) && isClickedTrump) {
                    this.mainForm.myCardIsReady[i - j] = !b;
                }
                else {
                    break;
                }
            }
        }
        for (var k = 0; k < crlength; k++) {
            var toAddImage = this.mainForm.gameScene.cardImages[k];
            if (this.mainForm.myCardIsReady[k]) {
                //将选定的牌向上提升 via gameScene.cardImages
                if (!toAddImage || !toAddImage.getAttribute("status") || toAddImage.getAttribute("status") === "down") {
                    toAddImage.setAttribute("status", "up");
                    toAddImage.style.transform = "translate(0px, -".concat(CommonMethods.cardTiltHeight, "px)");
                }
            }
            else if (toAddImage && toAddImage.getAttribute("status") && toAddImage.getAttribute("status") === "up") {
                toAddImage.setAttribute("status", "down");
                toAddImage.style.transform = 'unset';
            }
        }
        this.mainForm.drawingFormHelper.validateSelectedCards();
        this.mainForm.gameScene.sendMessageToServer(CardsReady_REQUEST, this.mainForm.tractorPlayer.MyOwnId, JSON.stringify(this.mainForm.myCardIsReady));
    };
    // with colorful icons if applicabl
    DrawingFormHelper.prototype.reDrawToolbar = function (skipDestroy) {
        var _this = this;
        if (!skipDestroy)
            this.destroyToolbar();
        //如果打无主，无需再判断
        if (this.mainForm.tractorPlayer.CurrentHandState.Rank == 53)
            return;
        var availableTrump = this.mainForm.tractorPlayer.AvailableTrumps();
        var imageToolBar = this.mainForm.gameScene.toolbarImage;
        if (!imageToolBar) {
            imageToolBar = this.mainForm.gameScene.ui.create.div('.imageToolBar', this.mainForm.gameScene.ui.frameGameRoom);
            imageToolBar.setBackgroundImage('image/tractor/toolbar/suitsbar.png');
            imageToolBar.style['background-size'] = '100% 100%';
            imageToolBar.style['background-repeat'] = 'no-repeat';
            imageToolBar.style.right = "calc(".concat(this.mainForm.gameScene.coordinates.toolbarPosition.x, ")");
            imageToolBar.style.bottom = "calc(".concat(this.mainForm.gameScene.coordinates.toolbarPosition.y, ")");
            imageToolBar.style.width = "250px";
            imageToolBar.style.height = "50px";
            this.mainForm.gameScene.toolbarImage = imageToolBar;
        }
        var _loop_1 = function (i) {
            var isSuiteAvailable = availableTrump.includes(i + 1);
            var prevSuite = this_1.mainForm.gameScene.toolbarSuiteImages[i];
            if (prevSuite && (prevSuite.classList.contains(CommonMethods.classIsSuiteAvail) && !isSuiteAvailable || !prevSuite.classList.contains(CommonMethods.classIsSuiteAvail) && isSuiteAvailable)) {
                prevSuite.remove();
                delete this_1.mainForm.gameScene.toolbarSuiteImages[i];
            }
            else {
                if (prevSuite)
                    return "continue";
            }
            var suiteOffset = isSuiteAvailable ? 0 : 5;
            var classIsSuiteAvail = isSuiteAvailable ? ".".concat(CommonMethods.classIsSuiteAvail) : "";
            var imageToolBarSuit = this_1.mainForm.gameScene.ui.create.div(".imageToolBarSuit".concat(classIsSuiteAvail), imageToolBar);
            if (this_1.mainForm.gameScene.ui.storageFileForImages.hasOwnProperty("toolbar".concat(i + suiteOffset))) {
                imageToolBarSuit.setBackgroundImage(this_1.mainForm.gameScene.ui.storageFileForImages["toolbar".concat(i + suiteOffset)]);
            }
            else {
                imageToolBarSuit.setBackgroundImage("image/tractor/toolbar/tile0".concat((i + suiteOffset).toString().padStart(2, '0'), ".png"));
            }
            imageToolBarSuit.style['background-size'] = '100% 100%';
            imageToolBarSuit.style['background-repeat'] = 'no-repeat';
            imageToolBarSuit.style.width = "40px";
            imageToolBarSuit.style.height = "40px";
            imageToolBarSuit.style.right = "calc(5px + ".concat(50 * (4 - i), "px)");
            imageToolBarSuit.style.bottom = "5px";
            this_1.mainForm.gameScene.toolbarSuiteImages[i] = imageToolBarSuit;
            if (isSuiteAvailable && !this_1.mainForm.tractorPlayer.isObserver) {
                var trumpExpIndex_1 = this_1.mainForm.tractorPlayer.CurrentHandState.TrumpExposingPoker + 1;
                if (i == 4) {
                    if (this_1.mainForm.tractorPlayer.CurrentPoker.RedJoker() == 2)
                        trumpExpIndex_1 = SuitEnums.TrumpExposingPoker.PairRedJoker;
                    else
                        trumpExpIndex_1 = SuitEnums.TrumpExposingPoker.PairBlackJoker;
                }
                imageToolBarSuit.addEventListener('pointerdown', function () {
                    _this.mainForm.tractorPlayer.ExposeTrump(trumpExpIndex_1, i + 1, 0);
                });
            }
        };
        var this_1 = this;
        for (var i = 0; i < 5; i++) {
            _loop_1(i);
        }
    };
    DrawingFormHelper.prototype.TrumpMadeCardsShow = function () {
        this.destroyAllShowedCards();
        if (this.mainForm.tractorPlayer.CurrentHandState.IsNoTrumpMaker)
            return;
        if (this.mainForm.tractorPlayer.CurrentHandState.TrumpExposingPoker == SuitEnums.TrumpExposingPoker.None)
            return;
        var posID = this.mainForm.PlayerPosition[this.mainForm.tractorPlayer.CurrentHandState.TrumpMaker];
        if (posID == 1)
            return;
        var trumpMadeCard = (this.mainForm.tractorPlayer.CurrentHandState.Trump - 1) * 13 + this.mainForm.tractorPlayer.CurrentHandState.Rank;
        if (this.mainForm.tractorPlayer.CurrentHandState.TrumpExposingPoker == SuitEnums.TrumpExposingPoker.PairBlackJoker)
            trumpMadeCard = 52;
        else if (this.mainForm.tractorPlayer.CurrentHandState.TrumpExposingPoker == SuitEnums.TrumpExposingPoker.PairRedJoker)
            trumpMadeCard = 53;
        if (this.mainForm.tractorPlayer.CurrentHandState.TrumpExposingPoker > SuitEnums.TrumpExposingPoker.SingleRank) {
            this.DrawShowedCardsByPosition([trumpMadeCard, trumpMadeCard], posID);
        }
        else {
            this.DrawShowedCardsByPosition([trumpMadeCard], posID);
        }
    };
    DrawingFormHelper.prototype.TrumpMadeCardsShowFromLastTrick = function () {
        var trumpDict = {};
        var lastTrumpStates = this.mainForm.tractorPlayer.CurrentHandState.LastTrumpStates;
        // 如果是无人亮主，则不画
        if (lastTrumpStates.length === 1 && lastTrumpStates[0].IsNoTrumpMaker)
            return;
        lastTrumpStates.forEach(function (lastHandState) {
            var key1 = lastHandState.TrumpMaker;
            if (!Object.keys(trumpDict).includes(key1)) {
                trumpDict[key1] = {};
            }
            var val1 = trumpDict[key1];
            var key2 = lastHandState.Trump;
            if (!Object.keys(val1).includes(key2.toString())) {
                val1[key2.toString()] = lastHandState;
            }
            var val2 = val1[key2.toString()];
            val2.TrumpExposingPoker = Math.max(val2.TrumpExposingPoker, lastHandState.TrumpExposingPoker);
        });
        for (var _i = 0, _a = Object.entries(trumpDict); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            var player = key;
            var posIndex = this.mainForm.PlayerPosition[player];
            var suitToTrumInfo = value;
            var allTrumpCards = [];
            for (var _c = 0, _d = Object.entries(suitToTrumInfo); _c < _d.length; _c++) {
                var _e = _d[_c], key_1 = _e[0], value_1 = _e[1];
                var trump = parseInt(key_1);
                var trumpInfo = value_1;
                var trumpMadeCard = (trump - 1) * 13 + this.mainForm.tractorPlayer.CurrentHandState.Rank;
                if (trumpInfo.TrumpExposingPoker == SuitEnums.TrumpExposingPoker.PairBlackJoker)
                    trumpMadeCard = 52;
                else if (trumpInfo.TrumpExposingPoker == SuitEnums.TrumpExposingPoker.PairRedJoker)
                    trumpMadeCard = 53;
                var count = 1;
                if (trumpInfo.TrumpExposingPoker > SuitEnums.TrumpExposingPoker.SingleRank) {
                    count = 2;
                }
                for (var i = 0; i < count; i++) {
                    allTrumpCards.push(trumpMadeCard);
                }
            }
            this.DrawTrumpMadeCardsByPositionFromLastTrick(allTrumpCards, posIndex);
        }
    };
    DrawingFormHelper.prototype.destroyToolbar = function () {
        if (this.mainForm.gameScene.toolbarImage) {
            this.mainForm.gameScene.toolbarImage.remove();
            delete this.mainForm.gameScene.toolbarImage;
        }
        this.mainForm.gameScene.toolbarSuiteImages.forEach(function (image) {
            image.remove();
        });
        this.mainForm.gameScene.toolbarSuiteImages = [];
    };
    DrawingFormHelper.prototype.destroySidebar = function () {
        this.mainForm.gameScene.sidebarImages.forEach(function (image) {
            image.remove();
        });
        this.mainForm.gameScene.sidebarImages = [];
    };
    DrawingFormHelper.prototype.destroyAllCards = function () {
        this.mainForm.gameScene.cardImages.forEach(function (image) {
            image.remove();
        });
        this.mainForm.gameScene.cardImages = [];
        for (var i = 0; i < 54; i++) {
            this.mainForm.gameScene.cardServerNumToImage[i] = [];
        }
        this.mainForm.cardsOrderNumber = 0;
        this.mainForm.gameScene.cardImageSequence.forEach(function (image) {
            image.remove();
        });
        this.mainForm.gameScene.cardImageSequence = [];
    };
    DrawingFormHelper.prototype.resetAllCards = function () {
        this.mainForm.cardsOrderNumber = 0;
        this.mainForm.gameScene.cardImageSequence.forEach(function (image) {
            image.remove();
        });
        this.mainForm.gameScene.cardImageSequence = [];
        for (var _i = 0, _a = Object.entries(this.mainForm.gameScene.cardServerNumToImage); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], ci = _b[1];
            ci.forEach(function (c) {
                c.classList.remove(CommonMethods.classCardProcessed);
                c.setAttribute("status", "down");
                c.style.transform = 'unset';
            });
        }
    };
    DrawingFormHelper.prototype.destroyAllShowedCards = function () {
        this.mainForm.gameScene.showedCardImages.forEach(function (image) {
            image.remove();
        });
        this.mainForm.gameScene.showedCardImages = [];
        if (this.mainForm.gameScene.OverridingFlagImage) {
            this.mainForm.gameScene.OverridingFlagImage.remove();
        }
    };
    // drawing showed cards
    DrawingFormHelper.prototype.DrawShowedCardsByPosition = function (cards, pos) {
        if (!pos || pos < 1 || pos > 4) return;
        var positions = this.mainForm.gameScene.coordinates.showedCardsPositions;
        if (!positions || !positions[pos - 1]) return;
        
        var x = positions[pos - 1].x;
        var y = positions[pos - 1].y;
        this.DrawShowedCards(cards, x, y, this.mainForm.gameScene.showedCardImages, 1, pos);
    };
    // drawing TrumpMade cards from last trick
    DrawingFormHelper.prototype.DrawTrumpMadeCardsByPositionFromLastTrick = function (cards, pos) {
        if (!pos || !this.mainForm.gameScene.coordinates.trumpMadeCardsPositions[pos - 1]) return;
        var x = this.mainForm.gameScene.coordinates.trumpMadeCardsPositions[pos - 1].x;
        var y = this.mainForm.gameScene.coordinates.trumpMadeCardsPositions[pos - 1].y;
        this.DrawShowedCards(cards, x, y, this.mainForm.gameScene.showedCardImages, this.mainForm.gameScene.coordinates.trumpMadeCardsScale, pos === 3 ? 7 : pos, true);
    };
    DrawingFormHelper.prototype.DrawSidebarFull = function () {
        var isRoomFull = CommonMethods.GetPlayerCount(this.mainForm.tractorPlayer.CurrentGameState.Players) == 4;
        this.destroySidebar();
        var meRank = "2";
        var opRank = "2";
        if (isRoomFull) {
            var allPlayers = this.mainForm.tractorPlayer.CurrentGameState.Players;
            var meIndex = CommonMethods.GetPlayerIndexByID(allPlayers, this.mainForm.tractorPlayer.PlayerId);
            var opIndex = (meIndex + 1) % 4;
            meRank = CommonMethods.GetNumberString(allPlayers[meIndex].Rank);
            opRank = CommonMethods.GetNumberString(allPlayers[opIndex].Rank);
        }
        var meStarterString = "";
        var opStarterString = "";
        var starter = this.mainForm.tractorPlayer.CurrentHandState.Starter;
        if (starter) {
            var isMyTeamStarter = this.mainForm.PlayerPosition[starter] % 2 == 1;
            if (isMyTeamStarter)
                meStarterString = "\uFF0C\u505A\u5E84\uFF1A".concat(this.mainForm.gameScene.hidePlayerID ? "" : starter);
            else
                opStarterString = "\uFF0C\u505A\u5E84\uFF1A".concat(this.mainForm.gameScene.hidePlayerID ? "" : starter);
        }
        var meString = "\u6211\u65B9\uFF1A".concat(meRank).concat(meStarterString);
        var opString = "\u5BF9\u65B9\uFF1A".concat(opRank).concat(opStarterString);
        var sidebarMeText = this.mainForm.gameScene.ui.create.div('.sidebarMeText', meString, this.mainForm.gameScene.ui.frameGameRoom);
        sidebarMeText.style.fontFamily = 'serif';
        sidebarMeText.style.fontSize = '20px';
        sidebarMeText.style.color = 'orange';
        sidebarMeText.style.textAlign = 'left';
        sidebarMeText.style.left = "calc(0px)";
        sidebarMeText.style.top = "calc(60px)";
        this.mainForm.gameScene.sidebarImages.push(sidebarMeText);
        var sidebarOpText = this.mainForm.gameScene.ui.create.div('.sidebarOpText', opString, this.mainForm.gameScene.ui.frameGameRoom);
        sidebarOpText.style.fontFamily = 'serif';
        sidebarOpText.style.fontSize = '20px';
        sidebarOpText.style.color = 'orange';
        sidebarOpText.style.textAlign = 'left';
        sidebarOpText.style.left = "calc(0px)";
        sidebarOpText.style.top = "calc(90px)";
        this.mainForm.gameScene.sidebarImages.push(sidebarOpText);
        var trumpMakerString = "";
        var trumpIndex = 0;
        var trumpMaker = this.mainForm.tractorPlayer.CurrentHandState.TrumpMaker;
        if (trumpMaker && this.mainForm.tractorPlayer.CurrentHandState.IsNoTrumpMaker) {
            trumpMakerString = "无人亮主";
        }
        else if (trumpMaker) {
            trumpMakerString = trumpMaker;
            trumpIndex = this.mainForm.tractorPlayer.CurrentHandState.Trump;
        }
        var exposerString = "\u4EAE\u724C\uFF1A".concat(this.mainForm.gameScene.hidePlayerID ? "" : trumpMakerString);
        var sidebarTrumpText = this.mainForm.gameScene.ui.create.div('.sidebarTrumpText', exposerString, this.mainForm.gameScene.ui.frameGameRoom);
        sidebarTrumpText.style.fontFamily = 'serif';
        sidebarTrumpText.style.fontSize = '20px';
        sidebarTrumpText.style.color = 'orange';
        sidebarTrumpText.style.textAlign = 'left';
        sidebarTrumpText.style.left = "calc(0px)";
        sidebarTrumpText.style.top = "calc(120px)";
        this.mainForm.gameScene.sidebarImages.push(sidebarTrumpText);
        if (trumpMaker && !this.mainForm.tractorPlayer.CurrentHandState.IsNoTrumpMaker) {
            var count = 1;
            if (this.mainForm.tractorPlayer.CurrentHandState.TrumpExposingPoker > SuitEnums.TrumpExposingPoker.SingleRank)
                count++;
            if (this.mainForm.tractorPlayer.CurrentHandState.TrumpExposingPoker === SuitEnums.TrumpExposingPoker.PairBlackJoker)
                trumpIndex = 10;
            var x = sidebarTrumpText.clientWidth + 10;
            var increment = 25;
            for (var i = 0; i < count; i++) {
                var sidebarTrumpImage = this.mainForm.gameScene.ui.create.div('.sidebarTrumpImage', '', this.mainForm.gameScene.ui.frameGameRoom);
                if (this.mainForm.gameScene.ui.storageFileForImages.hasOwnProperty("toolbar".concat(trumpIndex - 1))) {
                    sidebarTrumpImage.setBackgroundImage(this.mainForm.gameScene.ui.storageFileForImages["toolbar".concat(trumpIndex - 1)]);
                }
                else {
                    sidebarTrumpImage.setBackgroundImage("image/tractor/toolbar/tile0".concat((trumpIndex - 1).toString().padStart(2, '0'), ".png"));
                }
                sidebarTrumpImage.style['background-size'] = '100% 100%';
                sidebarTrumpImage.style['background-repeat'] = 'no-repeat';
                sidebarTrumpImage.style.width = "25px";
                sidebarTrumpImage.style.height = "25px";
                sidebarTrumpImage.style.left = "calc(".concat(x, "px)");
                sidebarTrumpImage.style.top = "calc(120px)";
                this.mainForm.gameScene.sidebarImages.push(sidebarTrumpImage);
                x += increment;
            }
        }
    };
    DrawingFormHelper.prototype.DrawFinishedSendedCards = function () {
        this.mainForm.tractorPlayer.destroyAllClientMessages();
        this.destroyScoreImageAndCards();
        this.destroyLast8Cards();
        this.destroyAllShowedCards();
        this.DrawFinishedScoreImage();
    };
    DrawingFormHelper.prototype.DrawFinishedScoreImage = function () {
        //画底牌
        var posX = this.mainForm.gameScene.coordinates.last8Position.x;
        var posY = this.mainForm.gameScene.coordinates.last8Position.y;
        this.DrawShowedCards(this.mainForm.tractorPlayer.CurrentHandState.DiscardedCards, posX, posY, this.mainForm.gameScene.showedCardImages, 1, 3);
        //画上分牌
        posX = this.mainForm.gameScene.coordinates.scoreCardsPosition.x;
        posY = this.mainForm.gameScene.coordinates.scoreCardsPosition.y;
        this.DrawShowedCards(this.mainForm.tractorPlayer.CurrentHandState.ScoreCards, posX, posY, this.mainForm.gameScene.showedCardImages, 1, 3);
        //画得分明细
        //上分
        var winPoints = CommonMethods.GetScoreCardsScore(this.mainForm.tractorPlayer.CurrentHandState.ScoreCards);
        posX = this.mainForm.gameScene.coordinates.winPointsPosition.x;
        posY = this.mainForm.gameScene.coordinates.winPointsPosition.y;
        var earnedPointsImage = this.mainForm.gameScene.ui.create.div('.earnedPointsImage', "\u4E0A\u5206\uFF1A".concat(winPoints), this.mainForm.gameScene.ui.frameGameRoom);
        earnedPointsImage.style.fontFamily = 'serif';
        earnedPointsImage.style.fontSize = '20px';
        earnedPointsImage.style.color = 'orange';
        earnedPointsImage.style.textAlign = 'left';
        earnedPointsImage.style.left = "calc(".concat(posX, ")");
        earnedPointsImage.style.top = "calc(".concat(posY, ")");
        this.mainForm.gameScene.showedCardImages.push(earnedPointsImage);
        //底分
        var base = this.mainForm.tractorPlayer.CurrentHandState.ScoreLast8CardsBase;
        var multiplier = this.mainForm.tractorPlayer.CurrentHandState.ScoreLast8CardsMultiplier;
        var last8Points = base * multiplier;
        posX = this.mainForm.gameScene.coordinates.last8PointsPosition.x;
        posY = this.mainForm.gameScene.coordinates.last8PointsPosition.y;
        var last8PointsImage = this.mainForm.gameScene.ui.create.div('.last8PointsImage', "\u5E95\u5206\uFF1A".concat(last8Points), this.mainForm.gameScene.ui.frameGameRoom);
        last8PointsImage.style.fontFamily = 'serif';
        last8PointsImage.style.fontSize = '20px';
        last8PointsImage.style.color = 'orange';
        last8PointsImage.style.textAlign = 'left';
        last8PointsImage.style.left = "calc(".concat(posX, ")");
        last8PointsImage.style.top = "calc(".concat(posY, ")");
        this.mainForm.gameScene.showedCardImages.push(last8PointsImage);
        //底分明细
        if (base > 0) {
            posX = "".concat(posX, " + ").concat(last8PointsImage.clientWidth + 10, "px");
            var last8PointsDetailImage = this.mainForm.gameScene.ui.create.div('.last8PointsDetailImage', "\u3010".concat(base, "x").concat(multiplier, "\u3011"), this.mainForm.gameScene.ui.frameGameRoom);
            last8PointsDetailImage.style.fontFamily = 'serif';
            last8PointsDetailImage.style.fontSize = '20px';
            last8PointsDetailImage.style.color = 'yellow';
            last8PointsDetailImage.style.textAlign = 'left';
            last8PointsDetailImage.style.left = "calc(".concat(posX, ")");
            last8PointsDetailImage.style.top = "calc(".concat(posY, ")");
            this.mainForm.gameScene.showedCardImages.push(last8PointsDetailImage);
        }
        //罚分
        var scorePunishment = this.mainForm.tractorPlayer.CurrentHandState.ScorePunishment;
        posX = this.mainForm.gameScene.coordinates.punishmentPointsPosition.x;
        posY = this.mainForm.gameScene.coordinates.punishmentPointsPosition.y;
        var punishPointsImage = this.mainForm.gameScene.ui.create.div('.punishPointsImage', "\u7F5A\u5206\uFF1A".concat(scorePunishment), this.mainForm.gameScene.ui.frameGameRoom);
        punishPointsImage.style.fontFamily = 'serif';
        punishPointsImage.style.fontSize = '20px';
        punishPointsImage.style.color = 'orange';
        punishPointsImage.style.textAlign = 'left';
        punishPointsImage.style.left = "calc(".concat(posX, ")");
        punishPointsImage.style.top = "calc(".concat(posY, ")");
        this.mainForm.gameScene.showedCardImages.push(punishPointsImage);
        //总得分
        var allTotal = this.mainForm.tractorPlayer.CurrentHandState.Score;
        posX = this.mainForm.gameScene.coordinates.totalPointsPosition.x;
        posY = this.mainForm.gameScene.coordinates.totalPointsPosition.y;
        var totalPointsImage = this.mainForm.gameScene.ui.create.div('.totalPointsImage', "\u603B\u5206\uFF1A".concat(allTotal), this.mainForm.gameScene.ui.frameGameRoom);
        totalPointsImage.style.fontFamily = 'serif';
        totalPointsImage.style.fontSize = '20px';
        totalPointsImage.style.color = 'white';
        totalPointsImage.style.textAlign = 'left';
        totalPointsImage.style.left = "calc(".concat(posX, ")");
        totalPointsImage.style.top = "calc(".concat(posY, ")");
        this.mainForm.gameScene.showedCardImages.push(totalPointsImage);
    };
    DrawingFormHelper.prototype.destroyScoreTotalText = function () {
        if (this.mainForm.gameScene.scoreTotalText) {
            this.mainForm.gameScene.scoreTotalText.remove();
            delete this.mainForm.gameScene.scoreTotalText;
        }
    };
    DrawingFormHelper.prototype.destroyScoreImageAndCards = function () {
        this.mainForm.gameScene.scoreCardsImages.forEach(function (image) {
            image.remove();
        });
        this.mainForm.gameScene.scoreCardsImages = [];
        this.destroyScoreTotalText();
        this.mainForm.gameScene.scoreCardsIntsDrawn = [];
    };
    DrawingFormHelper.prototype.DrawScoreImageAndCards = function () {
        var _this = this;
        this.destroyScoreTotalText();
        //画得分图标
        var scores = this.mainForm.tractorPlayer.CurrentHandState.Score;
        var currentPointsText = this.mainForm.gameScene.ui.create.div('.currentPointsText', "\u4E0A\u5206\uFF1A".concat(scores), this.mainForm.gameScene.ui.frameGameRoom);
        currentPointsText.style.fontFamily = 'serif';
        currentPointsText.style.fontSize = '20px';
        currentPointsText.style.color = 'orange';
        currentPointsText.style.textAlign = 'left';
        currentPointsText.style.left = "calc(0px)";
        currentPointsText.style.top = "calc(150px)";
        this.mainForm.gameScene.scoreTotalText = currentPointsText;
        //画得分牌，画在得分图标的下边
        //静态
        if (this.mainForm.gameScene.isReplayMode) {
            this.DrawShowedCards(this.mainForm.tractorPlayer.CurrentHandState.ScoreCards, "0px", "180px", this.mainForm.gameScene.scoreCardsImages, 1 / 2, 6);
            return;
        }
        //动画
        var scale = 2 / 3;
        var scoreCardsIntsTotal = CommonMethods.deepCopy(this.mainForm.tractorPlayer.CurrentHandState.ScoreCards);
        var scIntsToDraw = CommonMethods.ArrayMinus(scoreCardsIntsTotal, this.mainForm.gameScene.scoreCardsIntsDrawn);
        var sciToDrawLocked = CommonMethods.deepCopy(scIntsToDraw);
        var showedCardImagesIdentifiedIndex = [];
        var scoreCardsImagesToAnimate = [];
        for (var i = 0; i < sciToDrawLocked.length; i++) {
            var curServerCardNum = sciToDrawLocked[i];
            for (var j = 0; j < this.mainForm.gameScene.showedCardImages.length; j++) {
                if (showedCardImagesIdentifiedIndex.includes(j))
                    continue;
                var cardImageShowed = this.mainForm.gameScene.showedCardImages[j];
                var serverCardNumFromImage = parseInt(cardImageShowed.getAttribute("serverCardNumber"));
                if (serverCardNumFromImage === curServerCardNum) {
                    scoreCardsImagesToAnimate.push(cardImageShowed);
                    scIntsToDraw = CommonMethods.ArrayRemoveOneByValue(scIntsToDraw, serverCardNumFromImage);
                    showedCardImagesIdentifiedIndex.push(j);
                    break;
                }
            }
        }
        var tempX = "0px + ".concat(this.mainForm.gameScene.coordinates.handCardOffset * scale * this.mainForm.gameScene.scoreCardsIntsDrawn.length, "px");
        this.DrawShowedCards(scIntsToDraw, tempX, "180px", this.mainForm.gameScene.scoreCardsImages, scale, 6);
        this.mainForm.gameScene.scoreCardsIntsDrawn = this.mainForm.gameScene.scoreCardsIntsDrawn.concat(scIntsToDraw);
        var IntsDrawnLen = this.mainForm.gameScene.scoreCardsIntsDrawn.length;
        var scitaLen = scoreCardsImagesToAnimate.length;
        if (scitaLen === 0)
            return;
        var scitaCopy = [];
        for (var i = 0; i < scitaLen; i++) {
            var cardImageOriginal = scoreCardsImagesToAnimate[i];
            var serverCardNumFromImage = parseInt(cardImageOriginal.getAttribute("serverCardNumber"));
            var uiCardNumber = CommonMethods.ServerToUICardMap[serverCardNumFromImage];
            var cardImageClone = this.createCard(this.mainForm.gameScene.ui.frameGameRoom, uiCardNumber, scale);
            cardImageClone.style.opacity = 0;
            cardImageClone.style.left = "".concat(cardImageOriginal.offsetLeft, "px");
            cardImageClone.style.top = "".concat(cardImageOriginal.offsetTop, "px");
            cardImageClone.style.width = "".concat(cardImageOriginal.clientWidth, "px");
            cardImageClone.style.height = "".concat(cardImageOriginal.clientHeight, "px");
            cardImageClone.style.transition = "".concat(CommonMethods.distributeLast8Duration, "s");
            cardImageClone.style['transition-delay'] = "".concat(CommonMethods.distributeLast8Interval * (i + 1), "s");
            scitaCopy.push(cardImageClone);
            this.mainForm.gameScene.scoreCardsImages.push(cardImageClone);
            this.mainForm.gameScene.ui.frameGameRoom.appendChild(cardImageClone);
            this.mainForm.gameScene.scoreCardsIntsDrawn.push(serverCardNumFromImage);
        }
        setTimeout(function (scitaCp) {
            var startX = _this.mainForm.gameScene.coordinates.handCardOffset * scale * IntsDrawnLen;
            var startY = 180;
            var wid = _this.mainForm.gameScene.coordinates.cardWidth * scale;
            var hei = _this.mainForm.gameScene.coordinates.cardHeight * scale;
            for (var i = 0; i < scitaLen; i++) {
                var curImage = scitaCp[i];
                curImage.style.opacity = 1;
                curImage.style.left = "calc(".concat(startX, "px)");
                curImage.style.top = "calc(".concat(startY, "px)");
                curImage.style.width = "calc(".concat(wid, "px)");
                curImage.style.height = "calc(".concat(hei, "px)");
                startX += _this.mainForm.gameScene.coordinates.handCardOffset * (scale);
            }
        }, 1000 * CommonMethods.distributeLast8Delay, scitaCopy);
    };
    DrawingFormHelper.prototype.destroyLast8Cards = function () {
        this.mainForm.gameScene.last8CardsImages.forEach(function (image) {
            image.remove();
        });
        this.mainForm.gameScene.last8CardsImages = [];
    };
    DrawingFormHelper.prototype.DrawDiscardedCards = function (doAni) {
        this.destroyLast8Cards();
        var allCards = Array(8).fill(CommonMethods.cardBackIndex);
        if (this.mainForm.tractorPlayer.CurrentHandState.Last8Holder === this.mainForm.tractorPlayer.PlayerId || this.mainForm.gameScene.isReplayMode) {
            allCards = this.mainForm.tractorPlayer.CurrentHandState.DiscardedCards;
        }
        if (!doAni) {
            var posX = this.mainForm.gameScene.coordinates.last8CardsForStarterPosition.x;
            var posY = this.mainForm.gameScene.coordinates.last8CardsForStarterPosition.y;
            this.DrawShowedCards(allCards, posX, posY, this.mainForm.gameScene.last8CardsImages, 0.67, 5);
        }
        else {
            //画8张底牌，初始位置
            var x = this.mainForm.gameScene.coordinates.discardLast8AniPosition.x;
            var y = this.mainForm.gameScene.coordinates.discardLast8AniPosition.y;
            this.DrawShowedCards(allCards, x, y, this.mainForm.gameScene.last8CardsImages, 1, 5);
            this.MoveDiscardedLast8Cards();
        }
    };
    //画庄家埋底的动画
    DrawingFormHelper.prototype.MoveDiscardedLast8Cards = function () {
        var _this = this;
        var posX = "".concat(this.mainForm.gameScene.coordinates.last8CardsForStarterPosition.x, " - ").concat(this.mainForm.gameScene.coordinates.cardWidth / 6, "px");
        var posY = "".concat(this.mainForm.gameScene.coordinates.last8CardsForStarterPosition.y, " - ").concat(this.mainForm.gameScene.coordinates.cardHeight / 6, "px");
        var scale = 0.67;
        var count = this.mainForm.gameScene.last8CardsImages.length;
        for (var i = 0; i < count; i++) {
            var cardImage = this.mainForm.gameScene.last8CardsImages[i];
            cardImage.style.transition = "".concat(CommonMethods.distributeLast8Duration, "s");
            cardImage.style['transition-delay'] = "".concat(CommonMethods.distributeLast8Interval * (7 - i), "s");
        }
        //画8张底牌，最终位置
        setTimeout(function (x, y, sc) {
            for (var i = count - 1; i >= 0; i--) {
                var curImage = _this.mainForm.gameScene.last8CardsImages[i];
                curImage.style.right = "calc(".concat(x, ")");
                curImage.style.top = "calc(".concat(y, ")");
                curImage.style.scale = sc;
                x = "".concat(x, " + ").concat(_this.mainForm.gameScene.coordinates.handCardOffset * sc, "px");
            }
        }, 1000 * CommonMethods.distributeLast8Delay, posX, posY, scale);
    };
    //基于庄家相对于自己所在的位置，画庄家获得底牌的动画
    DrawingFormHelper.prototype.DrawDistributingLast8Cards = function (position) {
        var _this = this;
        //画8张底牌
        var last8Images = [];
        var x = this.mainForm.gameScene.coordinates.distributingLast8Position.x;
        var y = this.mainForm.gameScene.coordinates.distributingLast8Position.y;
        var cardBackIndex = 54;
        for (var i = 0; i < 8; i++) {
            var cardImage = this.createCard(this.mainForm.gameScene.ui.frameGameRoom, cardBackIndex, 1);
            cardImage.style.left = "calc(".concat(x, ")");
            cardImage.style.bottom = "calc(".concat(y, ")");
            cardImage.style.transition = "".concat(CommonMethods.distributeLast8Duration, "s");
            cardImage.style['transition-delay'] = "".concat(CommonMethods.distributeLast8Interval * (7 - i), "s");
            x = "".concat(x, " + ").concat(this.mainForm.gameScene.coordinates.distributingLast8PositionOffset, "px");
            last8Images.push(cardImage);
        }
        //分发
        setTimeout(function () {
            for (var i = 7; i >= 0; i--) {
                var posInd = position - 1;
                var curImage = last8Images[i];
                if (posInd === 1)
                    curImage.style.left = "calc(100% - ".concat(_this.mainForm.gameScene.coordinates.cardWidth, "px)");
                else
                    curImage.style.left = "calc(".concat(_this.mainForm.gameScene.coordinates.playerSkinPositions[posInd].x, ")");
                if (posInd === 2)
                    curImage.style.bottom = "calc(99% - ".concat(_this.mainForm.gameScene.coordinates.cardHeight, "px)");
                else
                    curImage.style.bottom = "calc(".concat(_this.mainForm.gameScene.coordinates.playerSkinPositions[posInd].y, ")");
            }
        }, 1000 * CommonMethods.distributeLast8Delay);
        //隐藏
        setTimeout(function () {
            last8Images.forEach(function (image) {
                image.remove();
            });
            last8Images.length = 0;
        }, 1500);
    };
    DrawingFormHelper.prototype.DrawOverridingFlag = function (cardsCount, position, winType, playAnimation) {
        if (this.mainForm.tractorPlayer.CurrentRoomSetting.HideOverridingFlag)
            return;
        if (this.mainForm.tractorPlayer.ShowLastTrickCards)
            return;
        if (this.mainForm.gameScene.OverridingFlagImage) {
            this.mainForm.gameScene.OverridingFlagImage.remove();
        }
        var orImage = this.mainForm.gameScene.ui.create.div('.orImage', this.mainForm.gameScene.ui.frameGameRoom);
        orImage.setBackgroundImage("image/tractor/".concat(this.mainForm.gameScene.overridingLabelImages[winType], ".png"));
        var posInd = position - 1;
        var x = this.mainForm.gameScene.coordinates.showedCardsPositions[posInd].x;
        if (posInd === 0 || posInd === 2) {
            x = "".concat(x, " - ").concat(this.mainForm.gameScene.coordinates.handCardOffset * (cardsCount - 1) / 2, "px");
        }
        var y = this.mainForm.gameScene.coordinates.showedCardsPositions[posInd].y;
        switch (posInd) {
            case 1:
                x = "".concat(x, " + ").concat(this.mainForm.gameScene.coordinates.handCardOffset * (cardsCount - 1), "px");
                orImage.style.right = "calc(".concat(x, " + ").concat(this.mainForm.gameScene.coordinates.cardWidth - this.mainForm.gameScene.coordinates.overridingFlagWidth, "px)");
                orImage.style.bottom = "calc(".concat(y, ")");
                break;
            case 2:
                y = "".concat(y, " + ").concat(this.mainForm.gameScene.coordinates.cardHeight - this.mainForm.gameScene.coordinates.overridingFlagHeight, "px");
                orImage.style.left = "calc(".concat(x, ")");
                orImage.style.top = "calc(".concat(y, ")");
                break;
            default:
                orImage.style.left = "calc(".concat(x, ")");
                orImage.style.bottom = "calc(".concat(y, ")");
                break;
        }
        orImage.style.width = "".concat(this.mainForm.gameScene.coordinates.overridingFlagWidth, "px");
        orImage.style.height = "".concat(this.mainForm.gameScene.coordinates.overridingFlagHeight, "px");
        orImage.style['background-size'] = '100% 100%';
        orImage.style['background-repeat'] = 'no-repeat';
        this.mainForm.gameScene.OverridingFlagImage = orImage;
        if (playAnimation && winType >= 2) {
            // getting the location of the OverridingFlag image, which should match the first showed cards from the winner player
            var rect = orImage.getBoundingClientRect();
            decadeUI.animation.playSpine2D(this.mainForm.gameScene.overridingLabelAnims[winType][0], rect.left, document.documentElement.clientHeight - rect.bottom, this.mainForm.gameScene.coordinates.cardWidth, this.mainForm.gameScene.coordinates.cardHeight, this.mainForm.gameScene.overridingLabelAnims[winType][1]);
        }
    };
    DrawingFormHelper.prototype.DrawEmojiByPosition = function (position, emojiType, emojiIndex, isCenter) {
        var _this = this;
        var emojiURL = "image/tractor/emoji/".concat(EmojiUtil.emojiTypes[emojiType]).concat(emojiIndex, ".gif?").concat(new Date().getTime());
        var img = new Image();
        img.onload = function (e) {
            var fixedWidth, fixedHeight;
            var wid = e.target.width;
            var hei = e.target.height;
            var emojiImage = _this.mainForm.gameScene.ui.create.div('.emojiImage', _this.mainForm.gameScene.ui.frameGameRoom);
            emojiImage.style.position = 'absolute';
            if (isCenter) {
                if (_this.mainForm.gameScene.isInGameHall()) {
                    fixedWidth = _this.mainForm.gameScene.ui.frameGameHall.clientWidth / 2;
                }
                else {
                    fixedWidth = _this.mainForm.gameScene.ui.frameGameRoom.clientWidth / 2;
                }
                fixedHeight = fixedWidth * hei / wid;
                emojiImage.style.top = 'calc(50%)';
                emojiImage.style.left = 'calc(50%)';
                emojiImage.style.width = "calc(".concat(fixedWidth, "px)");
                emojiImage.style.height = "calc(".concat(fixedHeight, "px)");
                emojiImage.style.transform = "translate(-50%, -50%)";
                emojiImage.style.transition = "0s";
            }
            else {
                fixedHeight = EmojiUtil.fixedHeight;
                fixedWidth = fixedHeight * wid / hei;
                emojiImage.style.width = "calc(".concat(fixedWidth, "px)");
                emojiImage.style.height = "calc(".concat(fixedHeight, "px)");
                var x = _this.mainForm.gameScene.coordinates.trumpMadeCardsPositions[position - 1].x;
                var y = _this.mainForm.gameScene.coordinates.trumpMadeCardsPositions[position - 1].y;
                if (position === 1)
                    y = _this.mainForm.gameScene.coordinates.handCardPositions[3].y;
                switch (position) {
                    case 1:
                    case 4:
                        emojiImage.style.left = "calc(".concat(x, ")");
                        emojiImage.style.bottom = "calc(".concat(y, ")");
                        break;
                    case 2:
                        emojiImage.style.right = "calc(".concat(x, ")");
                        emojiImage.style.bottom = "calc(".concat(y, ")");
                        break;
                    case 3:
                        emojiImage.style.right = "calc(".concat(x, ")");
                        emojiImage.style.top = "calc(".concat(y, ")");
                        break;
                    default:
                        break;
                }
            }
            // emojiImage.style.zIndex = CommonMethods.zIndexSettingsForm;
            emojiImage.setBackgroundImage(emojiURL);
            emojiImage.style['background-size'] = '100% 100%';
            emojiImage.style['background-repeat'] = 'no-repeat';
            setTimeout(function () {
                emojiImage.remove();
            }, 1000 * EmojiUtil.displayDuration);
        };
        img.src = emojiURL;
    };
    DrawingFormHelper.prototype.DrawMovingTractorByPosition = function (cardsCount, position) {
        var height = this.mainForm.gameScene.coordinates.cardHeight - 10;
        var width = height * 10 / 9;
        var torImage = this.mainForm.gameScene.ui.create.div('.orImage', this.mainForm.gameScene.ui.frameGameRoom);
        torImage.hide();
        torImage.setBackgroundImage("image/tractor/movingtrac4.gif");
        var posInd = position - 1;
        var x = this.mainForm.gameScene.coordinates.showedCardsPositions[posInd].x;
        if (posInd === 0 || posInd === 2) {
            x = "".concat(x, " - ").concat(this.mainForm.gameScene.coordinates.handCardOffset * (cardsCount - 1) / 2, "px");
        }
        var y = this.mainForm.gameScene.coordinates.showedCardsPositions[posInd].y;
        switch (posInd) {
            case 1:
                x = "".concat(x, " + ").concat(this.mainForm.gameScene.coordinates.handCardOffset * (cardsCount - 1), "px");
                torImage.style.right = "calc(".concat(x, " + ").concat(this.mainForm.gameScene.coordinates.cardWidth - width, "px)");
                torImage.style.bottom = "calc(".concat(y, ")");
                break;
            case 2:
                y = "".concat(y, " + ").concat(this.mainForm.gameScene.coordinates.cardHeight - height, "px");
                torImage.style.left = "calc(".concat(x, ")");
                torImage.style.top = "calc(".concat(y, ")");
                break;
            default:
                torImage.style.left = "calc(".concat(x, ")");
                torImage.style.bottom = "calc(".concat(y, ")");
                break;
        }
        torImage.style.width = "".concat(width, "px");
        torImage.style.height = "".concat(height, "px");
        torImage.style['background-size'] = '100% 100%';
        torImage.style['background-repeat'] = 'no-repeat';
        torImage.show();
        setTimeout(function () {
            torImage.hide();
        }, 3000);
        // movingtrac3.gif
        // let posInd = position - 1
        // let height = this.mainForm.gameScene.coordinates.cardHeight - 10;
        // let x = this.mainForm.gameScene.coordinates.showedCardsPositions[posInd].x;
        // let y = `${this.mainForm.gameScene.coordinates.showedCardsPositions[posInd].y} + ${this.mainForm.gameScene.coordinates.cardHeight - height}px`;
        // switch (posInd) {
        //     case 0:
        //         x = x - (cardsCount - 1) * this.mainForm.gameScene.coordinates.handCardOffset / 2
        //         break;
        //     case 1:
        //         x = x - (cardsCount - 1) * this.mainForm.gameScene.coordinates.handCardOffset
        //         break;
        //     case 2:
        //         x = x - (cardsCount - 1) * this.mainForm.gameScene.coordinates.handCardOffset / 2
        //         break;
        //     case 3:
        //         break;
        //     default:
        //         break;
        // }
        // let spriteAnimation = this.mainForm.gameScene.add.sprite(x, y, EmojiUtil.emMovingTractor)
        //     .setDisplaySize(height * EmojiUtil.emMovingTractorYToXRatio, height);
        // spriteAnimation.setOrigin(0);
        // spriteAnimation.play(EmojiUtil.emMovingTractor);
    };
    DrawingFormHelper.prototype.DrawDanmu = function (msgString) {
        var _this = this;
        if (this.mainForm.gameScene.noDanmu.toLowerCase() === 'true')
            return;
        // truncate danmu message to certain length
        if (msgString && msgString.length > CommonMethods.danmuMaxLength) {
            msgString = "".concat(msgString.slice(0, CommonMethods.danmuMaxLength), "...(\u7565)");
        }
        var danmuIndex = 0;
        var foundEmptyDanmu = false;
        var foundDanmu = false;
        if (this.mainForm.gameScene.danmuMessages.length > 0) {
            for (var i = 0; i < this.mainForm.gameScene.danmuMessages.length; i++) {
                if (this.mainForm.gameScene.danmuMessages[i] === undefined) {
                    if (!foundEmptyDanmu) {
                        foundEmptyDanmu = true;
                        danmuIndex = i;
                    }
                }
                else {
                    foundDanmu = true;
                    if (!foundEmptyDanmu)
                        danmuIndex = i + 1;
                }
            }
        }
        if (!foundDanmu) {
            this.destroyAllDanmuMessages();
        }
        var posY = "calc(".concat(this.mainForm.gameScene.coordinates.danmuPositionY, " + ").concat(this.mainForm.gameScene.coordinates.danmuOffset * danmuIndex, "px)");
        var lblDanmu = this.mainForm.gameScene.ui.create.div('', msgString, this.mainForm.gameScene.ui.frameMain);
        lblDanmu.style.color = 'white';
        // 核心优化：高亮弹幕系统消息和全服广播
        if (msgString.indexOf("【系统消息】") !== -1 || msgString.indexOf("【全服广播】") !== -1) {
            lblDanmu.style.color = "yellow";
            lblDanmu.style.fontWeight = "bold";
        }
        lblDanmu.style.fontFamily = 'serif';
        lblDanmu.style.fontSize = '25px';
        lblDanmu.style.left = "calc(100%)";
        lblDanmu.style.top = "calc(".concat(posY, ")");
        lblDanmu.style.transition = "left ".concat(CommonMethods.danmuDuration, "s");
        lblDanmu.style['transition-timing-function'] = 'linear';
        lblDanmu.style['white-space'] = 'nowrap';
        lblDanmu.style['z-index'] = CommonMethods.zIndexDanmu;
        this.mainForm.gameScene.danmuMessages[danmuIndex] = lblDanmu;
        setTimeout(function () {
            lblDanmu.style.left = "calc(0% - ".concat(lblDanmu.clientWidth, "px)");
        }, 100);
        setTimeout(function () {
            _this.mainForm.gameScene.danmuMessages[danmuIndex] = undefined;
            lblDanmu.remove();
        }, (CommonMethods.danmuDuration + 1) * 1000);
    };
    DrawingFormHelper.prototype.destroyAllDanmuMessages = function () {
        if (this.mainForm.gameScene.danmuMessages == null || this.mainForm.gameScene.danmuMessages.length == 0)
            return;
        this.mainForm.gameScene.danmuMessages.forEach(function (msg) {
            if (msg)
                msg.remove();
        });
        this.mainForm.gameScene.danmuMessages = [];
    };
    DrawingFormHelper.prototype.resetReplay = function () {
        this.destroyAllCards();
        this.destroyAllShowedCards();
        this.destroyScoreImageAndCards();
        this.mainForm.tractorPlayer.destroyAllClientMessages();
    };
    return DrawingFormHelper;
}());
export { DrawingFormHelper };
