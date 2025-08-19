import React from 'react';
import { navigate } from "expo-router/build/global-state/routing";
import { Text, View, Button, StyleSheet, StatusBar, Platform } from "react-native";
import * as NavigationBar from 'expo-navigation-bar';

export default function Index() {
  if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
  }

  const startGame = () => {
    navigate("./game");
  }

  return (
    <View style={styleSheet.mainView}>
      <StatusBar/>
      <View style={{flex: 1,justifyContent: "center",alignItems: "center",}}>
        <Text style={styleSheet.title}>SOLITARE</Text>
      </View>
      <Button title="Play" onPress={ () => startGame() }/>
      <View style={{flex: 1}}/>
    </View>
  );
}

const styleSheet = StyleSheet.create({
  mainView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#009933"
  },
  title: {
    fontSize: 75, 
    color: "white", 
    textShadowRadius: 10, 
    textShadowColor: "black", 
    fontWeight: 500
  }
});
