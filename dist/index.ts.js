import { SimpleUser } from "https://esm.sh/sip.js/lib/platform/web";
import { getAudio, getButton, getButtons, getInput, getSpan } from "./utils.ts";
const serverSpan = getSpan("server");
const targetSpan = getSpan("target");
const connectButton = getButton("connect");
const callButton = getButton("call");
const hangupButton = getButton("hangup");
const disconnectButton = getButton("disconnect");
const audioElement = getAudio("remoteAudio");
const keypad = getButtons("keypad");
const dtmfSpan = getSpan("dtmf");
const holdCheckbox = getInput("hold");
const muteCheckbox = getInput("mute");
const webSocketServer = "wss://edge.sip.onsip.com";
serverSpan.innerHTML = webSocketServer;
const target = "sip:echo@sipjs.onsip.com";
targetSpan.innerHTML = target;
const displayName = "SIP.js Demo";
const simpleUserDelegate = {
    onCallCreated: () => {
        console.log(`[${displayName}] Call created`);
        callButton.disabled = true;
        hangupButton.disabled = false;
        keypadDisabled(true);
        holdCheckboxDisabled(true);
        muteCheckboxDisabled(true);
    },
    onCallAnswered: () => {
        console.log(`[${displayName}] Call answered`);
        keypadDisabled(false);
        holdCheckboxDisabled(false);
        muteCheckboxDisabled(false);
    },
    onCallHangup: () => {
        console.log(`[${displayName}] Call hangup`);
        callButton.disabled = false;
        hangupButton.disabled = true;
        keypadDisabled(true);
        holdCheckboxDisabled(true);
        muteCheckboxDisabled(true);
    },
    onCallHold: (held) => {
        console.log(`[${displayName}] Call hold ${held}`);
        holdCheckbox.checked = held;
    },
};
const simpleUserOptions = {
    delegate: simpleUserDelegate,
    media: {
        remote: {
            audio: audioElement,
        },
    },
    userAgentOptions: {
        displayName,
    },
};
const simpleUser = new SimpleUser(webSocketServer, simpleUserOptions);
connectButton.addEventListener("click", () => {
    connectButton.disabled = true;
    disconnectButton.disabled = true;
    callButton.disabled = true;
    hangupButton.disabled = true;
    simpleUser
        .connect()
        .then(() => {
        connectButton.disabled = true;
        disconnectButton.disabled = false;
        callButton.disabled = false;
        hangupButton.disabled = true;
    })
        .catch((error) => {
        connectButton.disabled = false;
        console.error(`[${simpleUser.id}] failed to connect`);
        console.error(error);
        alert("Failed to connect.\n" + error);
    });
});
callButton.addEventListener("click", () => {
    callButton.disabled = true;
    hangupButton.disabled = true;
    simpleUser
        .call(target, {
        inviteWithoutSdp: false,
    })
        .catch((error) => {
        console.error(`[${simpleUser.id}] failed to place call`);
        console.error(error);
        alert("Failed to place call.\n" + error);
    });
});
hangupButton.addEventListener("click", () => {
    callButton.disabled = true;
    hangupButton.disabled = true;
    simpleUser.hangup().catch((error) => {
        console.error(`[${simpleUser.id}] failed to hangup call`);
        console.error(error);
        alert("Failed to hangup call.\n" + error);
    });
});
disconnectButton.addEventListener("click", () => {
    connectButton.disabled = true;
    disconnectButton.disabled = true;
    callButton.disabled = true;
    hangupButton.disabled = true;
    simpleUser
        .disconnect()
        .then(() => {
        connectButton.disabled = false;
        disconnectButton.disabled = true;
        callButton.disabled = true;
        hangupButton.disabled = true;
    })
        .catch((error) => {
        console.error(`[${simpleUser.id}] failed to disconnect`);
        console.error(error);
        alert("Failed to disconnect.\n" + error);
    });
});
keypad.forEach((button) => {
    button.addEventListener("click", () => {
        const tone = button.textContent;
        if (tone) {
            simpleUser.sendDTMF(tone).then(() => {
                dtmfSpan.innerHTML += tone;
            });
        }
    });
});
const keypadDisabled = (disabled) => {
    keypad.forEach((button) => (button.disabled = disabled));
    dtmfSpan.innerHTML = "";
};
holdCheckbox.addEventListener("change", () => {
    if (holdCheckbox.checked) {
        simpleUser.hold().catch((error) => {
            holdCheckbox.checked = false;
            console.error(`[${simpleUser.id}] failed to hold call`);
            console.error(error);
            alert("Failed to hold call.\n" + error);
        });
    }
    else {
        simpleUser.unhold().catch((error) => {
            holdCheckbox.checked = true;
            console.error(`[${simpleUser.id}] failed to unhold call`);
            console.error(error);
            alert("Failed to unhold call.\n" + error);
        });
    }
});
const holdCheckboxDisabled = (disabled) => {
    holdCheckbox.checked = false;
    holdCheckbox.disabled = disabled;
};
muteCheckbox.addEventListener("change", () => {
    if (muteCheckbox.checked) {
        simpleUser.mute();
        if (simpleUser.isMuted() === false) {
            muteCheckbox.checked = false;
            console.error(`[${simpleUser.id}] failed to mute call`);
            alert("Failed to mute call.\n");
        }
    }
    else {
        simpleUser.unmute();
        if (simpleUser.isMuted() === true) {
            muteCheckbox.checked = true;
            console.error(`[${simpleUser.id}] failed to unmute call`);
            alert("Failed to unmute call.\n");
        }
    }
});
const muteCheckboxDisabled = (disabled) => {
    muteCheckbox.checked = false;
    muteCheckbox.disabled = disabled;
};
connectButton.disabled = false;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZmlsZTovLy9Vc2Vycy9pdXJ5cGl2YS9naXQtcmVwb3MvaXVyeXBpdmEvc2lwanMvc3JjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQXlDLE1BQU0sd0NBQXdDLENBQUM7QUFDM0csT0FBTyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFaEYsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyQyxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDM0MsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3JDLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN6QyxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNqRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDN0MsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3BDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQyxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEMsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBR3RDLE1BQU0sZUFBZSxHQUFHLDBCQUEwQixDQUFDO0FBQ25ELFVBQVUsQ0FBQyxTQUFTLEdBQUcsZUFBZSxDQUFDO0FBR3ZDLE1BQU0sTUFBTSxHQUFHLDBCQUEwQixDQUFDO0FBQzFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsTUFB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