import { View } from "react-native";
import { AnimatedRef } from "react-native-reanimated";

export default interface UsesAnimatedRef {
    ref?: AnimatedRef<View>;
}