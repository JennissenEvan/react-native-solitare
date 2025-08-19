import { View } from "react-native";
import { AnimatedRef } from "react-native-reanimated";
import DropActionReceiver from "./dropActionReceiver";

export default interface DropActionArea {
    receiver: DropActionReceiver;
    ref: AnimatedRef<View>;
}
