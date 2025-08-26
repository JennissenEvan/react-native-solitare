# React Native Solitare

A basic solitare app built entirely in [React Native](https://reactnative.dev/). Currently, it supports both web and Android.

The web version can be played [here](https://jennissenevan.github.io/react-native-solitare/). The Android apk can be downloaded from the [latest release](https://github.com/JennissenEvan/react-native-solitare/releases).

## How to Play

This game is based on the [Klondike](https://en.wikipedia.org/wiki/Klondike_(solitaire)) version of solitare. Score points by revealing cards in the tableau, which can be done by stacking them on top of other cards in order of rank and with alternating suits. Cards of each suit can be stacked on their corresponding foundation pile, which starts with aces and goes up in order of rank. The game is finished when all of the four kings are placed in the foundation piles.

When there are no more options to rearrage the tableau piles, cards can be drawn from the main deck. Cards will be drawn from the deck in order, and when the pile is empty, it will cycle back from the top. Cards can be drawn an unlimited number of times, but points are lost every time the drawn cards are recycled.

Any mistakes can be reversed with the undo button, but doing so will cause points to be lost.
