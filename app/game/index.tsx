import React from 'react';
import DropActionArea from "@/src/dropActionArea";
import DropActionReceiver from "@/src/dropActionReceiver";
import { Foundation } from "@/src/foundation";
import TableauPile from "@/src/tableauPile";
import { useState } from "react";
import { Platform, StatusBar, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { AnimatedRef, measure, MeasuredDimensions, runOnJS, useAnimatedRef, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { allSuits, Card, CardCollection, CardDragContext, Deck, Position, PostCardDragCallback } from "../../src/deck";
import SharedDropActionArea from '@/src/sharedDropActionArea';
import * as NavigationBar from 'expo-navigation-bar';
import Talon from '@/src/talon';
import RefreshCardsContext from '@/src/refreshCardsContext';

const stock = new Deck();
const talon = new Talon();
const foundations = allSuits.map((it) => new Foundation(it));
const tableau = Array.from(Array(7).keys()).map((i) => {
    const pile = new TableauPile();
    Array.from(Array(i + 1).keys()).forEach(() => {
        pile.faceDownCards.put(stock.draw()!!);
    });
    pile.update();
    return pile;
});
talon.cardStack.put(stock.draw()!!);

const hand = new CardCollection();

let cardReturnCallback: PostCardDragCallback | undefined;
let cardMovedCallback: (() => void) | undefined;

interface HandDisplayProps {
    handCards: Card[];
    ref: AnimatedRef<View>;
    cardRef: AnimatedRef<View>;
    initialPosition: Position;
    style: StyleProp<ViewStyle>[];
}

const HandDisplay = (props: HandDisplayProps) => {
    let position = props.initialPosition;
    if (Platform.OS !== "web") {
        //Android handles layout coordinates differently than web, so we must translate the position here.
        const windowDimensions = useWindowDimensions();
        position = new Position(position.x - (windowDimensions.width / 2), position.y - (windowDimensions.height));
    }
    
    return (
        <Animated.View ref={props.ref} style={props.style}>
            {
                props.handCards.map((it, i) => {
                    const cardRef = i == 0 ? props.cardRef : undefined;
                    return <it.Element key={i} y={i * 30 + position.y} x={position.x} useAbsolute={true} ref={cardRef}/>;
                })
            }
        </Animated.View>
    );
}

export default function Index() {
    NavigationBar.setVisibilityAsync("hidden");

    const getTableauCards = () => {
        return tableau.map((it) => {
            return [...it.faceDownCards.pile, ...it.visibleStack.pile];
        });
    };
    const [tableauCards, setTableauCards] = useState<Card[][]>(getTableauCards());
    const [stockCards, setStockCards] = useState<Card[]>([...stock.cards.pile]);
    const [talonCards, setTalonCards] = useState<Card[]>([...talon.cardStack.pile]);
    const updateCardCollections = () => {
        setTableauCards(getTableauCards());
        setStockCards([...stock.cards.pile]);
        setTalonCards([...talon.cardStack.pile]);
    }

    const [handCards, setHandCards] = useState<Card[]>([]);
    const [handPosition, setHandPosition] = useState(new Position(0, 0));

    const mapDropReceivers = (receivers: DropActionReceiver[]) => {
        return receivers.map((it) => ({ receiver: it, ref: useAnimatedRef<View>() } as DropActionArea));
    }

    const handCardRef = useAnimatedRef<View>();

    const tableauDropAreas = mapDropReceivers(tableau);
    const foundationDropAreas = mapDropReceivers(foundations);

    const dropAreas = [...tableauDropAreas, ...foundationDropAreas];
    const sharedDropAreas = dropAreas.map((it, i) => ({ receiverIndex: i, ref: it.ref } as SharedDropActionArea));

    const updateHand = () => {
        setHandCards(Array.from(hand.pile));
    };

    const dragPositionX = useSharedValue(0);
    const dragPositionY = useSharedValue(0);
    const handRef = useAnimatedRef<View>();
    const handAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: dragPositionX.value },
                { translateY: dragPositionY.value }
            ]
        };
    });

    const attemptDropCards = (collidingDropAreas: SharedDropActionArea[]) => {
        const validDropAreas = collidingDropAreas.map((it) => {
            return { receiver: dropAreas[it.receiverIndex].receiver, ref: it.ref } as DropActionArea
        }).filter((it) => {
            console.log(it.receiver.canDrop(hand.pile))
            return it.receiver.canDrop(hand.pile);
        });

        if (validDropAreas.length != 0) {
            const dropArea = validDropAreas[0]
            dropArea.receiver.drop([...hand.pile]);
            return true;
        }

        return false;
    }

    const handReleasedCallback = (collidingDropAreas: SharedDropActionArea[]) => {
        if (attemptDropCards(collidingDropAreas)) {
            cardMovedCallback?.();
        } else {
            cardReturnCallback?.([...hand.pile]);
        }
        cardReturnCallback = undefined;
        cardMovedCallback = undefined;
        updateHand();
        updateCardCollections();
    }

    const tapAndDrag = Gesture.Pan()
    .onUpdate((e) => {
        dragPositionX.value = e.translationX;
        dragPositionY.value = e.translationY;
    })
    .onFinalize(() => {
        const handCardMeasurements = measure(handCardRef);

        let collidingDropAreas: SharedDropActionArea[] = [];
        if (handCardMeasurements !== null) {
            let cardStartX = handCardMeasurements.pageX;
            let cardStartY = handCardMeasurements.pageY;
            if (Platform.OS !== "web") {
                cardStartX += dragPositionX.value;
                cardStartY += dragPositionY.value;
            }
            const cardEndX = cardStartX + handCardMeasurements.width;
            const cardEndY = cardStartY + handCardMeasurements.height;

            collidingDropAreas = sharedDropAreas.filter((it) => {
                const dropAreaMeasurements = measure(it.ref);
                if (dropAreaMeasurements !== null) {
                    const dropStartX = dropAreaMeasurements.pageX;
                    const dropStartY = dropAreaMeasurements.pageY;
                    const dropEndX = dropStartX + dropAreaMeasurements.width;
                    const dropEndY = dropStartY + dropAreaMeasurements.height;

                    return !(
                        cardStartX > dropEndX ||
                        cardEndX < dropStartX ||
                        cardStartY > dropEndY ||
                        cardEndY < dropStartY
                    );
                }

                return false;
            });
        }

        dragPositionX.value = 0;
        dragPositionY.value = 0;

        runOnJS(handReleasedCallback)(collidingDropAreas);
    });

    const cardDragCallback = (
        cards: Card[], 
        initialPosition: Position, 
        returnCallback?: PostCardDragCallback,
        movedCallback?: () => void
    ) => {
        cards.forEach((it) => hand.put(it));
        cardReturnCallback = returnCallback;
        cardMovedCallback = movedCallback;
        updateHand();

        const measurement = measure(handRef);
        let handPosition = new Position(0, 0);
        if (measurement !== null) {
            handPosition = new Position(measurement.pageX, measurement.pageY);
        }
        setHandPosition(initialPosition.translated(-handPosition.x, -handPosition.y));

        updateCardCollections();
    }

    return (
        <GestureHandlerRootView>
            <GestureDetector gesture={tapAndDrag}>
                <View style={styleSheet.mainView}>
                    <CardDragContext value={cardDragCallback}>
                        <StatusBar/>
                        <View style={styleSheet.shelf}>
                            <View style={styleSheet.drawZone}>
                                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                    <RefreshCardsContext value={updateCardCollections}>
                                        <stock.Element cards={stockCards}/>
                                    </RefreshCardsContext>
                                </View>
                                <View style={styleSheet.talonZone}>
                                    <talon.Element cards={talonCards}/>
                                </View>
                            </View>
                            <View style={styleSheet.foundations}>
                                { foundations.map((it, i) => <it.Element key={i} ref={foundationDropAreas[i].ref}/>) }
                            </View>
                        </View>
                        <View style={styleSheet.table}>
                            <View style={styleSheet.tableau}>
                                { tableau.map((it, i) => <it.Element key={i} ref={tableauDropAreas[i].ref} cards={tableauCards[i]}/>) }
                            </View>
                        </View>
                        <HandDisplay handCards={handCards} ref={handRef} cardRef={handCardRef} initialPosition={handPosition} style={[handAnimatedStyle]}/>
                    </CardDragContext>
                </View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
}

const styleSheet = StyleSheet.create({
    mainView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    shelf: {
        backgroundColor: "#006622", 
        flex: 1, 
        width: "100%", 
        borderBottomWidth: 3, 
        borderColor: "#262626",
        flexDirection: "row"
    },
    drawZone: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
    },
    foundations: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignContent: "center",
        alignItems: "center"
    },
    table: {
        backgroundColor: "#009933", 
        flex: 2, 
        width: "100%", 
        justifyContent: "center", 
        alignItems: "center"
    },
    tableau: {
        flex: 1,
        flexDirection: "row",
        justifyContent:"space-evenly",
        alignItems: "stretch",
        alignContent: "center",
        width: "100%",
    },
    talonZone: {
        flex: 3,
        height: "75%",
        borderColor: "#262626",
        borderWidth: 2,
        backgroundColor: "#006622",
        alignItems: "center",
        justifyContent: "center"
    }
});
