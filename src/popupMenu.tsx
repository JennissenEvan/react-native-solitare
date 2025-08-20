import { PropsWithChildren } from "react";
import { Modal, StyleSheet, View } from "react-native";

interface PopupMenuProps {
    visible: boolean;
}

const PopupMenu = (props: PropsWithChildren<PopupMenuProps>) => {
    return (
        <>
            <Modal visible={props.visible} transparent={true}>
                <View style={styleSheet.menuBackroundOverlay}/>
            </Modal>
            <Modal visible={props.visible} transparent>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <View style={styleSheet.menu}>
                        { props.children }
                    </View>
                </View>
            </Modal>
        </>
    );
};
export default PopupMenu;

const styleSheet = StyleSheet.create({
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
    }
});
