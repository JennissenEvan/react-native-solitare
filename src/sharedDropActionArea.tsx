import { View } from "react-native";
import { AnimatedRef } from "react-native-reanimated";

export default interface SharedDropActionArea {
    receiverIndex: number;
    ref: AnimatedRef<View>;
}