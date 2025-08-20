import DropActionArea from "@/src/dropActionArea";
import DropActionReceiver from "@/src/dropActionReceiver";
import { Foundation } from "@/src/foundation";
import SharedDropActionArea from '@/src/sharedDropActionArea';
import TableauPile from "@/src/tableauPile";
import Talon from '@/src/talon';
import Transaction, { TransactionContext, TransactionController } from '@/src/transaction';
import * as NavigationBar from 'expo-navigation-bar';
import { navigate } from 'expo-router/build/global-state/routing';
import React, { useState } from 'react';
import { Button, Modal, Platform, StatusBar, StyleProp, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { AnimatedRef, measure, runOnJS, useAnimatedRef, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { allSuits, Card, CardCollection, CardDragContext, Deck, Position, PostCardDragCallback } from "../../src/deck";

let stock: Deck;
let talon: Talon;
let foundations: Foundation[];
let tableau: TableauPile[];
let transactions: Transaction[];
let score: number;
function startNewGame() {
    stock = new Deck();
    talon = new Talon();
    foundations = allSuits.map((it) => new Foundation(it));
    tableau = Array.from(Array(7).keys()).map((i) => {
        const pile = new TableauPile();
        Array.from(Array(i + 1).keys()).forEach(() => {
            pile.faceDownCards.put(stock.draw()!!);
        });
        pile.update();
        return pile;
    });
    talon.cardStack.put(stock.draw()!!);
    transactions = [];
    score = 1000;
}
startNewGame();

const hand = new CardCollection(true);

let cardReturnCallback: PostCardDragCallback | undefined;
let cardMovedCallback: ((transaction: TransactionController) => void) | undefined;

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
    if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("hidden");
    }

    const [menuVisible, setMenuVisible] = useState(false);

    const getTableauCards = () => {
        return tableau.map((it) => {
            return [...it.faceDownCards.pile, ...it.visibleStack.pile];
        });
    };
    const [tableauCards, setTableauCards] = useState<Card[][]>(getTableauCards());
    const [stockCards, setStockCards] = useState<Card[]>([...stock.cards.pile]);
    const [talonCards, setTalonCards] = useState<Card[]>([...talon.cardStack.pile]);
    const [displayScore, setDisplayScore] = useState(score);
    const updateCardCollections = () => {
        setTableauCards(getTableauCards());
        setStockCards([...stock.cards.pile]);
        setTalonCards([...talon.cardStack.pile]);
        setDisplayScore(score);
    }

    const [handCards, setHandCards] = useState<Card[]>([]);
    const [handPosition, setHandPosition] = useState(new Position(0, 0));

    const createTransaction = (bonus: number, undoCost: number = 0) => {
        const transaction = new Transaction(bonus, undoCost);

        return {
            add: (cards: Card[], destination: CardCollection) => {
                transaction.add(cards, destination);
            },
            commit: () => {
                if (transactions.includes(transaction)) {
                    console.warn("Attempted to commit transaction twice.");
                    return;
                }

                transaction.perform();
                transactions.push(transaction);
                score += transaction.bonus;
                score = Math.max(score, 0);
                updateCardCollections();
            },
            addScoreBonus: (bonus: number) => {
                transaction.bonus += bonus;
            },
            addUndoPenalty: (penalty: number) => {
                transaction.undoCost += penalty;
            }
        } as TransactionController;
    }

    const undoLastTransaction = () => {
        const transaction = transactions.pop();

        if (transaction === undefined) return;

        transaction.rollback();
        score -= transaction.bonus;
        score -= transaction.undoCost;
        score = Math.max(score, 0);
        updateCardCollections();
    };

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
            return it.receiver.canDrop(hand.pile);
        });

        if (validDropAreas.length != 0) {
            const transaction = createTransaction(0);
            const dropArea = validDropAreas[0]
            dropArea.receiver.drop([...hand.pile], transaction);
            return transaction;
        }

        return null;
    }

    const handReleasedCallback = (collidingDropAreas: SharedDropActionArea[]) => {
        const dropTransaction = attemptDropCards(collidingDropAreas);
        if (dropTransaction !== null) {
            cardMovedCallback?.(dropTransaction);
            dropTransaction.commit();
        } else {
            cardReturnCallback?.([...hand.pile]);
            updateCardCollections();
        }
        cardReturnCallback = undefined;
        cardMovedCallback = undefined;
        updateHand();
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
        movedCallback?: (transaction: TransactionController) => void
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
            <TransactionContext value={createTransaction}>
            <CardDragContext value={cardDragCallback}>
                <StatusBar/>
                <View style={styleSheet.shelf}>
                    <View style={styleSheet.drawZone}>
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <stock.Element cards={stockCards} talon={talon}/>
                        </View>
                        <View style={styleSheet.talonZone}>
                            <talon.Element cards={talonCards}/>
                        </View>
                    </View>
                    <View style={styleSheet.foundations}>
                        { foundations.map((it, i) => <it.Element key={i} ref={foundationDropAreas[i].ref}/>) }
                    </View>
                    <View style={{ flex: 0.2, justifyContent: "center", alignItems: "center", padding: 10 }}>
                        <View style={styleSheet.scoreBox}>
                            <Text style={styleSheet.scoreText}>Score:</Text>
                            <Text style={styleSheet.scoreText}>{displayScore}</Text>
                        </View>
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <Button title="undo" color={"green"} onPress={undoLastTransaction}/>
                        </View>
                    </View>
                </View>
                <View style={styleSheet.table}>
                    <View style={styleSheet.tableau}>
                        <View style={styleSheet.tableauGutterLeft}/>
                        { tableau.map((it, i) => <it.Element key={i} ref={tableauDropAreas[i].ref} cards={tableauCards[i]}/>) }
                        <View style={styleSheet.tableauGutterRight}>
                            <View style={{ flex: 2 }}/>
                            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                <Button title={"menu"} color={"green"} onPress={() => setMenuVisible(true)}/>
                            </View>
                        </View>
                    </View>
                </View>
                <HandDisplay handCards={handCards} ref={handRef} cardRef={handCardRef} initialPosition={handPosition} style={[handAnimatedStyle]}/>
            </CardDragContext>
            </TransactionContext>
            </View>
        </GestureDetector>
        <Modal visible={menuVisible} transparent={true}>
            <View style={styleSheet.menuBackroundOverlay}/>
        </Modal>
        <Modal visible={menuVisible} transparent>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <View style={styleSheet.menu}>
                    <Button title="Continue" color={"green"} onPress={() => setMenuVisible(false)}/>
                    <Button title="New Game" color={"green"} onPress={() => { startNewGame(); updateCardCollections(); setMenuVisible(false); }}/>
                    <Button title="Return to Title" color={"green"} onPress={() => navigate("/")}/>
                </View>
            </View>
        </Modal>
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
        padding: 20
    },
    tableauGutterLeft: {
        flex: 0.25
    },
    tableauGutterRight: {
        flex: 0.75
    },
    talonZone: {
        flex: 3,
        height: "75%",
        borderColor: "#262626",
        borderWidth: 2,
        backgroundColor: "#006622",
        alignItems: "center",
        justifyContent: "center"
    },
    menuBackroundOverlay: {
        width: "100%", 
        height: "100%", 
        backgroundColor: "rgba(0, 0, 0, 1)", 
        opacity: 0.5
    },
    menu: {
        width: "30%",
        height: "80%",
        borderRadius: 5,
        borderWidth: 4,
        backgroundColor: "#006622",
        alignItems: "center",
        justifyContent: "space-evenly"
    },
    scoreBox: {
        flex: 1, 
        borderWidth: 2, 
        width: '100%', 
        alignItems: "center", 
        justifyContent: "center",
        margin: 20
    },
    scoreText: {
        fontWeight: 500,
        color: "white",
        fontSize: 24
    }
});
