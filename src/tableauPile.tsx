import { useContext, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Card, CardCollection, CardDragContext, DownturnedCard, getCardSpacing, getRawCardDimensions, Position, PostCardDragCallback } from "./deck";
import DropActionReceiver from "./dropActionReceiver";
import UsesAnimatedRef from "./usesAnimatedRef";
import CardCollectionDisplay from "./cardCollectionDisplay";

const TABLEAU_COMPRESSION = 130;

interface TableauPileItem {
    card: Card;
    isVisible: boolean;
}

export default class TableauPile implements DropActionReceiver {
    faceDownCards = new CardCollection();
    visibleStack = new CardCollection();

    Element = (props: UsesAnimatedRef & CardCollectionDisplay) => {
        const getPileItems = () => {
            return props.cards.map((card) => {
                return { card, isVisible: this.visibleStack.pile.includes(card) } as TableauPileItem;
            });
        };

        const superCardDragCallback = useContext(CardDragContext);
    
        const cardDragCallback = (
            cards: Card[], 
            initialPosition: Position, 
            superReturnCallback?: PostCardDragCallback,
            superMovedCallback?: () => void
        ) => {
            const returnCallback = (cards: Card[]) => {
                superReturnCallback?.(cards);
            };
            const movedCallback = () => {
                superMovedCallback?.();
                const faceDownPileLength = this.faceDownCards.pile.length;
                if (this.visibleStack.pile.length == 0 && faceDownPileLength > 0) {
                    this.visibleStack.put(this.faceDownCards.pile[faceDownPileLength - 1]);
                }
            };

            const cardStack = this.visibleStack.pile.slice(this.visibleStack.pile.indexOf(cards[0]));

            superCardDragCallback?.(cardStack, initialPosition, returnCallback, movedCallback);
        };

        const pileItems = getPileItems();

        const cardHeight = getRawCardDimensions().height;
        const cardSpacing = getCardSpacing();

        return (
            <View style={styleSheet.tableauPile}>
                <CardDragContext value={cardDragCallback}>
                    {
                        pileItems.map((it, i) => {
                            const compressBy = (-cardHeight + cardSpacing) * i;
                            const cardRef = i == pileItems.length - 1 ? props.ref : undefined;
                            const key = `${pileItems.length}-${i}`
                            return (it.isVisible ? <it.card.Element y={compressBy} key={key} ref={cardRef}/> : <DownturnedCard y={compressBy} key={key}/>);
                        })
                    }
                </CardDragContext>
            </View>
        );
    }

    update() {
        if (this.visibleStack.pile.length == 0 && this.faceDownCards.pile.length > 0) {
            this.visibleStack.put(this.faceDownCards.draw()!!);
        }
    }

    stack(card: Card) {
        this.visibleStack.put(card);
    }

    canDrop(cards: Card[]) {
        const visibleCards = this.visibleStack.pile.length;

        if (cards.length == 0 || visibleCards == 0) return false;

        const handCard = cards[0];
        const tableauCard = this.visibleStack.pile[visibleCards - 1];
        return handCard.rank.value == tableauCard.rank.value - 1 && handCard.suit.color !== tableauCard.suit.color;
    }

    drop(cards: Card[]) {
        cards.forEach((it) => {
            this.stack(it);
        });
    }
}

const styleSheet = StyleSheet.create({
    tableauPile: {
        flex: 1,
        alignItems: "center",
        alignContent: "center"
    }
});
