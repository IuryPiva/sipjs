// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function Ct() {
    return (o)=>!o.audio && !o.video ? Promise.resolve(new MediaStream) : navigator.mediaDevices === void 0 ? Promise.reject(new Error("Media devices not available in insecure contexts.")) : navigator.mediaDevices.getUserMedia.call(navigator.mediaDevices, o)
    ;
}
function yt() {
    return {
        bundlePolicy: "balanced",
        certificates: void 0,
        iceCandidatePoolSize: 0,
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302"
            }
        ],
        iceTransportPolicy: "all",
        peerIdentity: void 0,
        rtcpMuxPolicy: "require"
    };
}
var j = class {
    constructor(e, t, r){
        e.debug("SessionDescriptionHandler.constructor"), this.logger = e, this.mediaStreamFactory = t, this.sessionDescriptionHandlerConfiguration = r, this._localMediaStream = new MediaStream, this._remoteMediaStream = new MediaStream, this._peerConnection = new RTCPeerConnection(r == null ? void 0 : r.peerConnectionConfiguration), this.initPeerConnectionEventHandlers();
    }
    get localMediaStream() {
        return this._localMediaStream;
    }
    get remoteMediaStream() {
        return this._remoteMediaStream;
    }
    get dataChannel() {
        return this._dataChannel;
    }
    get peerConnection() {
        return this._peerConnection;
    }
    get peerConnectionDelegate() {
        return this._peerConnectionDelegate;
    }
    set peerConnectionDelegate(e) {
        this._peerConnectionDelegate = e;
    }
    static dispatchAddTrackEvent(e, t) {
        e.dispatchEvent(new MediaStreamTrackEvent("addtrack", {
            track: t
        }));
    }
    static dispatchRemoveTrackEvent(e, t) {
        e.dispatchEvent(new MediaStreamTrackEvent("removetrack", {
            track: t
        }));
    }
    close() {
        this.logger.debug("SessionDescriptionHandler.close"), this._peerConnection !== void 0 && (this._peerConnection.getReceivers().forEach((e)=>{
            e.track && e.track.stop();
        }), this._peerConnection.getSenders().forEach((e)=>{
            e.track && e.track.stop();
        }), this._dataChannel && this._dataChannel.close(), this._peerConnection.close(), this._peerConnection = void 0);
    }
    getDescription(e, t) {
        var r, s;
        if (this.logger.debug("SessionDescriptionHandler.getDescription"), this._peerConnection === void 0) return Promise.reject(new Error("Peer connection closed."));
        this.onDataChannel = e == null ? void 0 : e.onDataChannel;
        let i = (r = e == null ? void 0 : e.offerOptions) === null || r === void 0 ? void 0 : r.iceRestart, n = (e == null ? void 0 : e.iceGatheringTimeout) === void 0 ? (s = this.sessionDescriptionHandlerConfiguration) === null || s === void 0 ? void 0 : s.iceGatheringTimeout : e == null ? void 0 : e.iceGatheringTimeout;
        return this.getLocalMediaStream(e).then(()=>this.updateDirection(e)
        ).then(()=>this.createDataChannel(e)
        ).then(()=>this.createLocalOfferOrAnswer(e)
        ).then((a)=>this.applyModifiers(a, t)
        ).then((a)=>this.setLocalSessionDescription(a)
        ).then(()=>this.waitForIceGatheringComplete(i, n)
        ).then(()=>this.getLocalSessionDescription()
        ).then((a)=>({
                body: a.sdp,
                contentType: "application/sdp"
            })
        ).catch((a)=>{
            throw this.logger.error("SessionDescriptionHandler.getDescription failed - " + a), a;
        });
    }
    hasDescription(e) {
        return this.logger.debug("SessionDescriptionHandler.hasDescription"), e === "application/sdp";
    }
    sendDtmf(e, t) {
        if (this.logger.debug("SessionDescriptionHandler.sendDtmf"), this._peerConnection === void 0) return this.logger.error("SessionDescriptionHandler.sendDtmf failed - peer connection closed"), !1;
        let r = this._peerConnection.getSenders();
        if (r.length === 0) return this.logger.error("SessionDescriptionHandler.sendDtmf failed - no senders"), !1;
        let s = r[0].dtmf;
        if (!s) return this.logger.error("SessionDescriptionHandler.sendDtmf failed - no DTMF sender"), !1;
        let i = t == null ? void 0 : t.duration, n = t == null ? void 0 : t.interToneGap;
        try {
            s.insertDTMF(e, i, n);
        } catch (a) {
            return this.logger.error(a), !1;
        }
        return this.logger.log("SessionDescriptionHandler.sendDtmf sent via RTP: " + e.toString()), !0;
    }
    setDescription(e, t, r) {
        if (this.logger.debug("SessionDescriptionHandler.setDescription"), this._peerConnection === void 0) return Promise.reject(new Error("Peer connection closed."));
        this.onDataChannel = t == null ? void 0 : t.onDataChannel;
        let s = this._peerConnection.signalingState === "have-local-offer" ? "answer" : "offer";
        return this.getLocalMediaStream(t).then(()=>this.applyModifiers({
                sdp: e,
                type: s
            }, r)
        ).then((i)=>this.setRemoteSessionDescription(i)
        ).catch((i)=>{
            throw this.logger.error("SessionDescriptionHandler.setDescription failed - " + i), i;
        });
    }
    applyModifiers(e, t) {
        return this.logger.debug("SessionDescriptionHandler.applyModifiers"), !t || t.length === 0 ? Promise.resolve(e) : t.reduce((r, s)=>r.then(s)
        , Promise.resolve(e)).then((r)=>{
            if (this.logger.debug("SessionDescriptionHandler.applyModifiers - modified sdp"), !r.sdp || !r.type) throw new Error("Invalid SDP.");
            return {
                sdp: r.sdp,
                type: r.type
            };
        });
    }
    createDataChannel(e) {
        if (this._peerConnection === void 0) return Promise.reject(new Error("Peer connection closed."));
        if ((e == null ? void 0 : e.dataChannel) !== !0 || this._dataChannel) return Promise.resolve();
        switch(this._peerConnection.signalingState){
            case "stable":
                this.logger.debug("SessionDescriptionHandler.createDataChannel - creating data channel");
                try {
                    return this._dataChannel = this._peerConnection.createDataChannel((e == null ? void 0 : e.dataChannelLabel) || "", e == null ? void 0 : e.dataChannelOptions), this.onDataChannel && this.onDataChannel(this._dataChannel), Promise.resolve();
                } catch (t) {
                    return Promise.reject(t);
                }
            case "have-remote-offer":
                return Promise.resolve();
            case "have-local-offer":
            case "have-local-pranswer":
            case "have-remote-pranswer":
            case "closed":
            default:
                return Promise.reject(new Error("Invalid signaling state " + this._peerConnection.signalingState));
        }
    }
    createLocalOfferOrAnswer(e) {
        if (this._peerConnection === void 0) return Promise.reject(new Error("Peer connection closed."));
        switch(this._peerConnection.signalingState){
            case "stable":
                return this.logger.debug("SessionDescriptionHandler.createLocalOfferOrAnswer - creating SDP offer"), this._peerConnection.createOffer(e == null ? void 0 : e.offerOptions);
            case "have-remote-offer":
                return this.logger.debug("SessionDescriptionHandler.createLocalOfferOrAnswer - creating SDP answer"), this._peerConnection.createAnswer(e == null ? void 0 : e.answerOptions);
            case "have-local-offer":
            case "have-local-pranswer":
            case "have-remote-pranswer":
            case "closed":
            default:
                return Promise.reject(new Error("Invalid signaling state " + this._peerConnection.signalingState));
        }
    }
    getLocalMediaStream(e) {
        if (this.logger.debug("SessionDescriptionHandler.getLocalMediaStream"), this._peerConnection === void 0) return Promise.reject(new Error("Peer connection closed."));
        let t = Object.assign({}, e == null ? void 0 : e.constraints);
        if (this.localMediaStreamConstraints) {
            if (t.audio = t.audio || this.localMediaStreamConstraints.audio, t.video = t.video || this.localMediaStreamConstraints.video, JSON.stringify(this.localMediaStreamConstraints.audio) === JSON.stringify(t.audio) && JSON.stringify(this.localMediaStreamConstraints.video) === JSON.stringify(t.video)) return Promise.resolve();
        } else t.audio === void 0 && t.video === void 0 && (t = {
            audio: !0
        });
        return this.localMediaStreamConstraints = t, this.mediaStreamFactory(t, this).then((r)=>this.setLocalMediaStream(r)
        );
    }
    setLocalMediaStream(e) {
        if (this.logger.debug("SessionDescriptionHandler.setLocalMediaStream"), !this._peerConnection) throw new Error("Peer connection undefined.");
        let t = this._peerConnection, r = this._localMediaStream, s = [], i = (g)=>{
            let w = g.kind;
            if (w !== "audio" && w !== "video") throw new Error(`Unknown new track kind ${w}.`);
            let u = t.getSenders().find((v)=>v.track && v.track.kind === w
            );
            u ? s.push(new Promise((v)=>{
                this.logger.debug(`SessionDescriptionHandler.setLocalMediaStream - replacing sender ${w} track`), v();
            }).then(()=>u.replaceTrack(g).then(()=>{
                    let v = r.getTracks().find((E)=>E.kind === w
                    );
                    v && (v.stop(), r.removeTrack(v), j.dispatchRemoveTrackEvent(r, v)), r.addTrack(g), j.dispatchAddTrackEvent(r, g);
                }).catch((v)=>{
                    throw this.logger.error(`SessionDescriptionHandler.setLocalMediaStream - failed to replace sender ${w} track`), v;
                })
            )) : s.push(new Promise((v)=>{
                this.logger.debug(`SessionDescriptionHandler.setLocalMediaStream - adding sender ${w} track`), v();
            }).then(()=>{
                try {
                    t.addTrack(g, r);
                } catch (v) {
                    throw this.logger.error(`SessionDescriptionHandler.setLocalMediaStream - failed to add sender ${w} track`), v;
                }
                r.addTrack(g), j.dispatchAddTrackEvent(r, g);
            }));
        }, n = e.getAudioTracks();
        n.length && i(n[0]);
        let a = e.getVideoTracks();
        return a.length && i(a[0]), s.reduce((g, w)=>g.then(()=>w
            )
        , Promise.resolve());
    }
    getLocalSessionDescription() {
        if (this.logger.debug("SessionDescriptionHandler.getLocalSessionDescription"), this._peerConnection === void 0) return Promise.reject(new Error("Peer connection closed."));
        let e = this._peerConnection.localDescription;
        return e ? Promise.resolve(e) : Promise.reject(new Error("Failed to get local session description"));
    }
    setLocalSessionDescription(e) {
        return this.logger.debug("SessionDescriptionHandler.setLocalSessionDescription"), this._peerConnection === void 0 ? Promise.reject(new Error("Peer connection closed.")) : this._peerConnection.setLocalDescription(e);
    }
    setRemoteSessionDescription(e) {
        if (this.logger.debug("SessionDescriptionHandler.setRemoteSessionDescription"), this._peerConnection === void 0) return Promise.reject(new Error("Peer connection closed."));
        let t = e.sdp, r;
        switch(this._peerConnection.signalingState){
            case "stable":
                r = "offer";
                break;
            case "have-local-offer":
                r = "answer";
                break;
            case "have-local-pranswer":
            case "have-remote-offer":
            case "have-remote-pranswer":
            case "closed":
            default:
                return Promise.reject(new Error("Invalid signaling state " + this._peerConnection.signalingState));
        }
        return t ? this._peerConnection.setRemoteDescription({
            sdp: t,
            type: r
        }) : (this.logger.error("SessionDescriptionHandler.setRemoteSessionDescription failed - cannot set null sdp"), Promise.reject(new Error("SDP is undefined")));
    }
    setRemoteTrack(e) {
        this.logger.debug("SessionDescriptionHandler.setRemoteTrack");
        let t = this._remoteMediaStream;
        t.getTrackById(e.id) ? this.logger.debug(`SessionDescriptionHandler.setRemoteTrack - have remote ${e.kind} track`) : e.kind === "audio" ? (this.logger.debug(`SessionDescriptionHandler.setRemoteTrack - adding remote ${e.kind} track`), t.getAudioTracks().forEach((r)=>{
            r.stop(), t.removeTrack(r), j.dispatchRemoveTrackEvent(t, r);
        }), t.addTrack(e), j.dispatchAddTrackEvent(t, e)) : e.kind === "video" && (this.logger.debug(`SessionDescriptionHandler.setRemoteTrack - adding remote ${e.kind} track`), t.getVideoTracks().forEach((r)=>{
            r.stop(), t.removeTrack(r), j.dispatchRemoveTrackEvent(t, r);
        }), t.addTrack(e), j.dispatchAddTrackEvent(t, e));
    }
    updateDirection(e) {
        if (this._peerConnection === void 0) return Promise.reject(new Error("Peer connection closed."));
        switch(this._peerConnection.signalingState){
            case "stable":
                this.logger.debug("SessionDescriptionHandler.updateDirection - setting offer direction");
                {
                    let t = (r)=>{
                        switch(r){
                            case "inactive":
                                return (e == null ? void 0 : e.hold) ? "inactive" : "recvonly";
                            case "recvonly":
                                return (e == null ? void 0 : e.hold) ? "inactive" : "recvonly";
                            case "sendonly":
                                return (e == null ? void 0 : e.hold) ? "sendonly" : "sendrecv";
                            case "sendrecv":
                                return (e == null ? void 0 : e.hold) ? "sendonly" : "sendrecv";
                            case "stopped":
                                return "stopped";
                            default:
                                throw new Error("Should never happen");
                        }
                    };
                    this._peerConnection.getTransceivers().forEach((r)=>{
                        if (r.direction) {
                            let s = t(r.direction);
                            r.direction !== s && (r.direction = s);
                        }
                    });
                }
                break;
            case "have-remote-offer":
                this.logger.debug("SessionDescriptionHandler.updateDirection - setting answer direction");
                {
                    let t = (()=>{
                        let s = this._peerConnection.remoteDescription;
                        if (!s) throw new Error("Failed to read remote offer");
                        let i = /a=sendrecv\r\n|a=sendonly\r\n|a=recvonly\r\n|a=inactive\r\n/.exec(s.sdp);
                        if (i) switch(i[0]){
                            case `a=inactive\r
`:
                                return "inactive";
                            case `a=recvonly\r
`:
                                return "recvonly";
                            case `a=sendonly\r
`:
                                return "sendonly";
                            case `a=sendrecv\r
`:
                                return "sendrecv";
                            default:
                                throw new Error("Should never happen");
                        }
                        return "sendrecv";
                    })(), r = (()=>{
                        switch(t){
                            case "inactive":
                                return "inactive";
                            case "recvonly":
                                return "sendonly";
                            case "sendonly":
                                return (e == null ? void 0 : e.hold) ? "inactive" : "recvonly";
                            case "sendrecv":
                                return (e == null ? void 0 : e.hold) ? "sendonly" : "sendrecv";
                            default:
                                throw new Error("Should never happen");
                        }
                    })();
                    this._peerConnection.getTransceivers().forEach((s)=>{
                        s.direction && s.direction !== "stopped" && s.direction !== r && (s.direction = r);
                    });
                }
                break;
            case "have-local-offer":
            case "have-local-pranswer":
            case "have-remote-pranswer":
            case "closed":
            default:
                return Promise.reject(new Error("Invalid signaling state " + this._peerConnection.signalingState));
        }
        return Promise.resolve();
    }
    iceGatheringComplete() {
        this.logger.debug("SessionDescriptionHandler.iceGatheringComplete"), this.iceGatheringCompleteTimeoutId !== void 0 && (this.logger.debug("SessionDescriptionHandler.iceGatheringComplete - clearing timeout"), clearTimeout(this.iceGatheringCompleteTimeoutId), this.iceGatheringCompleteTimeoutId = void 0), this.iceGatheringCompletePromise !== void 0 && (this.logger.debug("SessionDescriptionHandler.iceGatheringComplete - resolving promise"), this.iceGatheringCompleteResolve && this.iceGatheringCompleteResolve(), this.iceGatheringCompletePromise = void 0, this.iceGatheringCompleteResolve = void 0, this.iceGatheringCompleteReject = void 0);
    }
    waitForIceGatheringComplete(e = !1, t = 0) {
        return this.logger.debug("SessionDescriptionHandler.waitForIceGatheringToComplete"), this._peerConnection === void 0 ? Promise.reject("Peer connection closed.") : !e && this._peerConnection.iceGatheringState === "complete" ? (this.logger.debug("SessionDescriptionHandler.waitForIceGatheringToComplete - already complete"), Promise.resolve()) : (this.iceGatheringCompletePromise !== void 0 && (this.logger.debug("SessionDescriptionHandler.waitForIceGatheringToComplete - rejecting prior waiting promise"), this.iceGatheringCompleteReject && this.iceGatheringCompleteReject(new Error("Promise superseded.")), this.iceGatheringCompletePromise = void 0, this.iceGatheringCompleteResolve = void 0, this.iceGatheringCompleteReject = void 0), this.iceGatheringCompletePromise = new Promise((r, s)=>{
            this.iceGatheringCompleteResolve = r, this.iceGatheringCompleteReject = s, t > 0 && (this.logger.debug("SessionDescriptionHandler.waitForIceGatheringToComplete - timeout in " + t), this.iceGatheringCompleteTimeoutId = setTimeout(()=>{
                this.logger.debug("SessionDescriptionHandler.waitForIceGatheringToComplete - timeout"), this.iceGatheringComplete();
            }, t));
        }), this.iceGatheringCompletePromise);
    }
    initPeerConnectionEventHandlers() {
        if (this.logger.debug("SessionDescriptionHandler.initPeerConnectionEventHandlers"), !this._peerConnection) throw new Error("Peer connection undefined.");
        let e = this._peerConnection;
        e.onconnectionstatechange = (t)=>{
            var r;
            let s = e.connectionState;
            this.logger.debug(`SessionDescriptionHandler.onconnectionstatechange ${s}`), ((r = this._peerConnectionDelegate) === null || r === void 0 ? void 0 : r.onconnectionstatechange) && this._peerConnectionDelegate.onconnectionstatechange(t);
        }, e.ondatachannel = (t)=>{
            var r;
            this.logger.debug("SessionDescriptionHandler.ondatachannel"), this._dataChannel = t.channel, this.onDataChannel && this.onDataChannel(this._dataChannel), ((r = this._peerConnectionDelegate) === null || r === void 0 ? void 0 : r.ondatachannel) && this._peerConnectionDelegate.ondatachannel(t);
        }, e.onicecandidate = (t)=>{
            var r;
            this.logger.debug("SessionDescriptionHandler.onicecandidate"), ((r = this._peerConnectionDelegate) === null || r === void 0 ? void 0 : r.onicecandidate) && this._peerConnectionDelegate.onicecandidate(t);
        }, e.onicecandidateerror = (t)=>{
            var r;
            this.logger.debug("SessionDescriptionHandler.onicecandidateerror"), ((r = this._peerConnectionDelegate) === null || r === void 0 ? void 0 : r.onicecandidateerror) && this._peerConnectionDelegate.onicecandidateerror(t);
        }, e.oniceconnectionstatechange = (t)=>{
            var r;
            let s = e.iceConnectionState;
            this.logger.debug(`SessionDescriptionHandler.oniceconnectionstatechange ${s}`), ((r = this._peerConnectionDelegate) === null || r === void 0 ? void 0 : r.oniceconnectionstatechange) && this._peerConnectionDelegate.oniceconnectionstatechange(t);
        }, e.onicegatheringstatechange = (t)=>{
            var r;
            let s = e.iceGatheringState;
            this.logger.debug(`SessionDescriptionHandler.onicegatheringstatechange ${s}`), s === "complete" && this.iceGatheringComplete(), ((r = this._peerConnectionDelegate) === null || r === void 0 ? void 0 : r.onicegatheringstatechange) && this._peerConnectionDelegate.onicegatheringstatechange(t);
        }, e.onnegotiationneeded = (t)=>{
            var r;
            this.logger.debug("SessionDescriptionHandler.onnegotiationneeded"), ((r = this._peerConnectionDelegate) === null || r === void 0 ? void 0 : r.onnegotiationneeded) && this._peerConnectionDelegate.onnegotiationneeded(t);
        }, e.onsignalingstatechange = (t)=>{
            var r;
            let s = e.signalingState;
            this.logger.debug(`SessionDescriptionHandler.onsignalingstatechange ${s}`), ((r = this._peerConnectionDelegate) === null || r === void 0 ? void 0 : r.onsignalingstatechange) && this._peerConnectionDelegate.onsignalingstatechange(t);
        }, e.onstatsended = (t)=>{
            var r;
            this.logger.debug("SessionDescriptionHandler.onstatsended"), ((r = this._peerConnectionDelegate) === null || r === void 0 ? void 0 : r.onstatsended) && this._peerConnectionDelegate.onstatsended(t);
        }, e.ontrack = (t)=>{
            var r;
            let s = t.track.kind, i = t.track.enabled ? "enabled" : "disabled";
            this.logger.debug(`SessionDescriptionHandler.ontrack ${s} ${i}`), this.setRemoteTrack(t.track), ((r = this._peerConnectionDelegate) === null || r === void 0 ? void 0 : r.ontrack) && this._peerConnectionDelegate.ontrack(t);
        };
    }
};
function It(o) {
    return (e, t)=>{
        o === void 0 && (o = Ct());
        let s = {
            iceGatheringTimeout: (t == null ? void 0 : t.iceGatheringTimeout) !== void 0 ? t == null ? void 0 : t.iceGatheringTimeout : 5000,
            peerConnectionConfiguration: Object.assign(Object.assign({}, yt()), t == null ? void 0 : t.peerConnectionConfiguration)
        }, i = e.userAgent.getLogger("sip.SessionDescriptionHandler");
        return new j(i, o, s);
    };
}
var Ae = class {
    constructor(e){
        this.parameters = {};
        for(let t in e)e.hasOwnProperty(t) && this.setParam(t, e[t]);
    }
    setParam(e, t) {
        e && (this.parameters[e.toLowerCase()] = typeof t == "undefined" || t === null ? null : t.toString());
    }
    getParam(e) {
        if (e) return this.parameters[e.toLowerCase()];
    }
    hasParam(e) {
        return !!(e && this.parameters[e.toLowerCase()] !== void 0);
    }
    deleteParam(e) {
        if (e = e.toLowerCase(), this.hasParam(e)) {
            let t = this.parameters[e];
            return delete this.parameters[e], t;
        }
    }
    clearParams() {
        this.parameters = {};
    }
};
var N = class extends Ae {
    constructor(e, t, r){
        super(r);
        this.uri = e, this._displayName = t;
    }
    get friendlyName() {
        return this.displayName || this.uri.aor;
    }
    get displayName() {
        return this._displayName;
    }
    set displayName(e) {
        this._displayName = e;
    }
    clone() {
        return new N(this.uri.clone(), this._displayName, JSON.parse(JSON.stringify(this.parameters)));
    }
    toString() {
        let e = this.displayName || this.displayName === "0" ? '"' + this.displayName + '" ' : "";
        e += "<" + this.uri.toString() + ">";
        for(let t in this.parameters)this.parameters.hasOwnProperty(t) && (e += ";" + t, this.parameters[t] !== null && (e += "=" + this.parameters[t]));
        return e;
    }
};
var B = class extends Ae {
    constructor(e = "sip", t, r, s, i, n){
        super(i || {});
        if (this.headers = {}, !r) throw new TypeError('missing or invalid "host" parameter');
        for(let a in n)n.hasOwnProperty(a) && this.setHeader(a, n[a]);
        this.raw = {
            scheme: e,
            user: t,
            host: r,
            port: s
        }, this.normal = {
            scheme: e.toLowerCase(),
            user: t,
            host: r.toLowerCase(),
            port: s
        };
    }
    get scheme() {
        return this.normal.scheme;
    }
    set scheme(e) {
        this.raw.scheme = e, this.normal.scheme = e.toLowerCase();
    }
    get user() {
        return this.normal.user;
    }
    set user(e) {
        this.normal.user = this.raw.user = e;
    }
    get host() {
        return this.normal.host;
    }
    set host(e) {
        this.raw.host = e, this.normal.host = e.toLowerCase();
    }
    get aor() {
        return this.normal.user + "@" + this.normal.host;
    }
    get port() {
        return this.normal.port;
    }
    set port(e) {
        this.normal.port = this.raw.port = e;
    }
    setHeader(e, t) {
        this.headers[this.headerize(e)] = t instanceof Array ? t : [
            t
        ];
    }
    getHeader(e) {
        if (e) return this.headers[this.headerize(e)];
    }
    hasHeader(e) {
        return !!e && !!this.headers.hasOwnProperty(this.headerize(e));
    }
    deleteHeader(e) {
        if (e = this.headerize(e), this.headers.hasOwnProperty(e)) {
            let t = this.headers[e];
            return delete this.headers[e], t;
        }
    }
    clearHeaders() {
        this.headers = {};
    }
    clone() {
        return new B(this._raw.scheme, this._raw.user || "", this._raw.host, this._raw.port, JSON.parse(JSON.stringify(this.parameters)), JSON.parse(JSON.stringify(this.headers)));
    }
    toRaw() {
        return this._toString(this._raw);
    }
    toString() {
        return this._toString(this._normal);
    }
    get _normal() {
        return this.normal;
    }
    get _raw() {
        return this.raw;
    }
    _toString(e) {
        let t = e.scheme + ":";
        e.scheme.toLowerCase().match("^sips?$") || (t += "//"), e.user && (t += this.escapeUser(e.user) + "@"), t += e.host, (e.port || e.port === 0) && (t += ":" + e.port);
        for(let s in this.parameters)this.parameters.hasOwnProperty(s) && (t += ";" + s, this.parameters[s] !== null && (t += "=" + this.parameters[s]));
        let r = [];
        for(let s1 in this.headers)if (this.headers.hasOwnProperty(s1)) for(let i in this.headers[s1])this.headers[s1].hasOwnProperty(i) && r.push(s1 + "=" + this.headers[s1][i]);
        return r.length > 0 && (t += "?" + r.join("&")), t;
    }
    escapeUser(e) {
        let t;
        try {
            t = decodeURIComponent(e);
        } catch (r) {
            throw r;
        }
        return encodeURIComponent(t).replace(/%3A/ig, ":").replace(/%2B/ig, "+").replace(/%3F/ig, "?").replace(/%2F/ig, "/");
    }
    headerize(e) {
        let t = {
            "Call-Id": "Call-ID",
            Cseq: "CSeq",
            "Min-Se": "Min-SE",
            Rack: "RAck",
            Rseq: "RSeq",
            "Www-Authenticate": "WWW-Authenticate"
        }, r = e.toLowerCase().replace(/_/g, "-").split("-"), s = r.length, i = "";
        for(let n = 0; n < s; n++)n !== 0 && (i += "-"), i += r[n].charAt(0).toUpperCase() + r[n].substring(1);
        return t[i] && (i = t[i]), i;
    }
};
function Ve(o, e) {
    if (o.scheme !== e.scheme || o.user !== e.user || o.host !== e.host || o.port !== e.port) return !1;
    function t(i, n) {
        let a = Object.keys(i.parameters), g = Object.keys(n.parameters);
        return !(!a.filter((u)=>g.includes(u)
        ).every((u)=>i.parameters[u] === n.parameters[u]
        ) || ![
            "user",
            "ttl",
            "method",
            "transport"
        ].every((u)=>i.hasParam(u) && n.hasParam(u) || !i.hasParam(u) && !n.hasParam(u)
        ) || ![
            "maddr"
        ].every((u)=>i.hasParam(u) && n.hasParam(u) || !i.hasParam(u) && !n.hasParam(u)
        ));
    }
    if (!t(o, e)) return !1;
    let r = Object.keys(o.headers), s = Object.keys(e.headers);
    if (r.length !== 0 || s.length !== 0) {
        if (r.length !== s.length) return !1;
        let i = r.filter((n)=>s.includes(n)
        );
        if (i.length !== s.length || !i.every((n)=>o.headers[n].length && e.headers[n].length && o.headers[n][0] === e.headers[n][0]
        )) return !1;
    }
    return !0;
}
var be = class extends Error {
    constructor(e, t, r, s){
        super();
        this.message = e, this.expected = t, this.found = r, this.location = s, this.name = "SyntaxError", typeof Error.captureStackTrace == "function" && Error.captureStackTrace(this, be);
    }
    static buildMessage(e, t) {
        function r(w) {
            return w.charCodeAt(0).toString(16).toUpperCase();
        }
        function s(w) {
            return w.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, (u)=>"\\x0" + r(u)
            ).replace(/[\x10-\x1F\x7F-\x9F]/g, (u)=>"\\x" + r(u)
            );
        }
        function i(w) {
            return w.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, (u)=>"\\x0" + r(u)
            ).replace(/[\x10-\x1F\x7F-\x9F]/g, (u)=>"\\x" + r(u)
            );
        }
        function n(w) {
            switch(w.type){
                case "literal":
                    return '"' + s(w.text) + '"';
                case "class":
                    let u = w.parts.map((v)=>Array.isArray(v) ? i(v[0]) + "-" + i(v[1]) : i(v)
                    );
                    return "[" + (w.inverted ? "^" : "") + u + "]";
                case "any":
                    return "any character";
                case "end":
                    return "end of input";
                case "other":
                    return w.description;
            }
        }
        function a(w) {
            let u = w.map(n), v, E;
            if (u.sort(), u.length > 0) {
                for(v = 1, E = 1; v < u.length; v++)u[v - 1] !== u[v] && (u[E] = u[v], E++);
                u.length = E;
            }
            switch(u.length){
                case 1:
                    return u[0];
                case 2:
                    return u[0] + " or " + u[1];
                default:
                    return u.slice(0, -1).join(", ") + ", or " + u[u.length - 1];
            }
        }
        function g(w) {
            return w ? '"' + s(w) + '"' : "end of input";
        }
        return "Expected " + a(e) + " but " + g(t) + " found.";
    }
};
function Mt(o, e) {
    e = e !== void 0 ? e : {};
    let t = {}, r = {
        Contact: 119,
        Name_Addr_Header: 156,
        Record_Route: 176,
        Request_Response: 81,
        SIP_URI: 45,
        Subscription_State: 186,
        Supported: 191,
        Require: 182,
        Via: 194,
        absoluteURI: 84,
        Call_ID: 118,
        Content_Disposition: 130,
        Content_Length: 135,
        Content_Type: 136,
        CSeq: 146,
        displayName: 122,
        Event: 149,
        From: 151,
        host: 52,
        Max_Forwards: 154,
        Min_SE: 213,
        Proxy_Authenticate: 157,
        quoted_string: 40,
        Refer_To: 178,
        Replaces: 179,
        Session_Expires: 210,
        stun_URI: 217,
        To: 192,
        turn_URI: 223,
        uuid: 226,
        WWW_Authenticate: 209,
        challenge: 158,
        sipfrag: 230,
        Referred_By: 231
    }, s = 119, i = [
        `\r
`,
        p(`\r
`, !1),
        /^[0-9]/,
        _([
            [
                "0",
                "9"
            ]
        ], !1, !1),
        /^[a-zA-Z]/,
        _([
            [
                "a",
                "z"
            ],
            [
                "A",
                "Z"
            ]
        ], !1, !1),
        /^[0-9a-fA-F]/,
        _([
            [
                "0",
                "9"
            ],
            [
                "a",
                "f"
            ],
            [
                "A",
                "F"
            ]
        ], !1, !1),
        /^[\0-\xFF]/,
        _([
            [
                "\0",
                "\xFF"
            ]
        ], !1, !1),
        /^["]/,
        _([
            '"'
        ], !1, !1),
        " ",
        p(" ", !1),
        "	",
        p("	", !1),
        /^[a-zA-Z0-9]/,
        _([
            [
                "a",
                "z"
            ],
            [
                "A",
                "Z"
            ],
            [
                "0",
                "9"
            ]
        ], !1, !1),
        ";",
        p(";", !1),
        "/",
        p("/", !1),
        "?",
        p("?", !1),
        ":",
        p(":", !1),
        "@",
        p("@", !1),
        "&",
        p("&", !1),
        "=",
        p("=", !1),
        "+",
        p("+", !1),
        "$",
        p("$", !1),
        ",",
        p(",", !1),
        "-",
        p("-", !1),
        "_",
        p("_", !1),
        ".",
        p(".", !1),
        "!",
        p("!", !1),
        "~",
        p("~", !1),
        "*",
        p("*", !1),
        "'",
        p("'", !1),
        "(",
        p("(", !1),
        ")",
        p(")", !1),
        "%",
        p("%", !1),
        function() {
            return " ";
        },
        function() {
            return ":";
        },
        /^[!-~]/,
        _([
            [
                "!",
                "~"
            ]
        ], !1, !1),
        /^[\x80-\uFFFF]/,
        _([
            [
                "\x80",
                "\uFFFF"
            ]
        ], !1, !1),
        /^[\x80-\xBF]/,
        _([
            [
                "\x80",
                "\xBF"
            ]
        ], !1, !1),
        /^[a-f]/,
        _([
            [
                "a",
                "f"
            ]
        ], !1, !1),
        "`",
        p("`", !1),
        "<",
        p("<", !1),
        ">",
        p(">", !1),
        "\\",
        p("\\", !1),
        "[",
        p("[", !1),
        "]",
        p("]", !1),
        "{",
        p("{", !1),
        "}",
        p("}", !1),
        function() {
            return "*";
        },
        function() {
            return "/";
        },
        function() {
            return "=";
        },
        function() {
            return "(";
        },
        function() {
            return ")";
        },
        function() {
            return ">";
        },
        function() {
            return "<";
        },
        function() {
            return ",";
        },
        function() {
            return ";";
        },
        function() {
            return ":";
        },
        function() {
            return '"';
        },
        /^[!-']/,
        _([
            [
                "!",
                "'"
            ]
        ], !1, !1),
        /^[*-[]/,
        _([
            [
                "*",
                "["
            ]
        ], !1, !1),
        /^[\]-~]/,
        _([
            [
                "]",
                "~"
            ]
        ], !1, !1),
        function(d) {
            return d;
        },
        /^[#-[]/,
        _([
            [
                "#",
                "["
            ]
        ], !1, !1),
        /^[\0-\t]/,
        _([
            [
                "\0",
                "	"
            ]
        ], !1, !1),
        /^[\x0B-\f]/,
        _([
            [
                "\v",
                "\f"
            ]
        ], !1, !1),
        /^[\x0E-\x7F]/,
        _([
            [
                "",
                "\x7F"
            ]
        ], !1, !1),
        function() {
            e = e || {
                data: {}
            }, e.data.uri = new B(e.data.scheme, e.data.user, e.data.host, e.data.port), delete e.data.scheme, delete e.data.user, delete e.data.host, delete e.data.host_type, delete e.data.port;
        },
        function() {
            e = e || {
                data: {}
            }, e.data.uri = new B(e.data.scheme, e.data.user, e.data.host, e.data.port, e.data.uri_params, e.data.uri_headers), delete e.data.scheme, delete e.data.user, delete e.data.host, delete e.data.host_type, delete e.data.port, delete e.data.uri_params, e.startRule === "SIP_URI" && (e.data = e.data.uri);
        },
        "sips",
        p("sips", !0),
        "sip",
        p("sip", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.scheme = d;
        },
        function() {
            e = e || {
                data: {}
            }, e.data.user = decodeURIComponent(S().slice(0, -1));
        },
        function() {
            e = e || {
                data: {}
            }, e.data.password = S();
        },
        function() {
            return e = e || {
                data: {}
            }, e.data.host = S(), e.data.host;
        },
        function() {
            return e = e || {
                data: {}
            }, e.data.host_type = "domain", S();
        },
        /^[a-zA-Z0-9_\-]/,
        _([
            [
                "a",
                "z"
            ],
            [
                "A",
                "Z"
            ],
            [
                "0",
                "9"
            ],
            "_",
            "-"
        ], !1, !1),
        /^[a-zA-Z0-9\-]/,
        _([
            [
                "a",
                "z"
            ],
            [
                "A",
                "Z"
            ],
            [
                "0",
                "9"
            ],
            "-"
        ], !1, !1),
        function() {
            return e = e || {
                data: {}
            }, e.data.host_type = "IPv6", S();
        },
        "::",
        p("::", !1),
        function() {
            return e = e || {
                data: {}
            }, e.data.host_type = "IPv6", S();
        },
        function() {
            return e = e || {
                data: {}
            }, e.data.host_type = "IPv4", S();
        },
        "25",
        p("25", !1),
        /^[0-5]/,
        _([
            [
                "0",
                "5"
            ]
        ], !1, !1),
        "2",
        p("2", !1),
        /^[0-4]/,
        _([
            [
                "0",
                "4"
            ]
        ], !1, !1),
        "1",
        p("1", !1),
        /^[1-9]/,
        _([
            [
                "1",
                "9"
            ]
        ], !1, !1),
        function(d) {
            return e = e || {
                data: {}
            }, d = parseInt(d.join("")), e.data.port = d, d;
        },
        "transport=",
        p("transport=", !0),
        "udp",
        p("udp", !0),
        "tcp",
        p("tcp", !0),
        "sctp",
        p("sctp", !0),
        "tls",
        p("tls", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.uri_params || (e.data.uri_params = {}), e.data.uri_params.transport = d.toLowerCase();
        },
        "user=",
        p("user=", !0),
        "phone",
        p("phone", !0),
        "ip",
        p("ip", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.uri_params || (e.data.uri_params = {}), e.data.uri_params.user = d.toLowerCase();
        },
        "method=",
        p("method=", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.uri_params || (e.data.uri_params = {}), e.data.uri_params.method = d;
        },
        "ttl=",
        p("ttl=", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.params || (e.data.params = {}), e.data.params.ttl = d;
        },
        "maddr=",
        p("maddr=", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.uri_params || (e.data.uri_params = {}), e.data.uri_params.maddr = d;
        },
        "lr",
        p("lr", !0),
        function() {
            e = e || {
                data: {}
            }, e.data.uri_params || (e.data.uri_params = {}), e.data.uri_params.lr = void 0;
        },
        function(d, f) {
            e = e || {
                data: {}
            }, e.data.uri_params || (e.data.uri_params = {}), f === null ? f = void 0 : f = f[1], e.data.uri_params[d.toLowerCase()] = f;
        },
        function(d, f) {
            d = d.join("").toLowerCase(), f = f.join(""), e = e || {
                data: {}
            }, e.data.uri_headers || (e.data.uri_headers = {}), e.data.uri_headers[d] ? e.data.uri_headers[d].push(f) : e.data.uri_headers[d] = [
                f
            ];
        },
        function() {
            e = e || {
                data: {}
            }, e.startRule === "Refer_To" && (e.data.uri = new B(e.data.scheme, e.data.user, e.data.host, e.data.port, e.data.uri_params, e.data.uri_headers), delete e.data.scheme, delete e.data.user, delete e.data.host, delete e.data.host_type, delete e.data.port, delete e.data.uri_params);
        },
        "//",
        p("//", !1),
        function() {
            e = e || {
                data: {}
            }, e.data.scheme = S();
        },
        p("SIP", !0),
        function() {
            e = e || {
                data: {}
            }, e.data.sip_version = S();
        },
        "INVITE",
        p("INVITE", !1),
        "ACK",
        p("ACK", !1),
        "VXACH",
        p("VXACH", !1),
        "OPTIONS",
        p("OPTIONS", !1),
        "BYE",
        p("BYE", !1),
        "CANCEL",
        p("CANCEL", !1),
        "REGISTER",
        p("REGISTER", !1),
        "SUBSCRIBE",
        p("SUBSCRIBE", !1),
        "NOTIFY",
        p("NOTIFY", !1),
        "REFER",
        p("REFER", !1),
        "PUBLISH",
        p("PUBLISH", !1),
        function() {
            return e = e || {
                data: {}
            }, e.data.method = S(), e.data.method;
        },
        function(d) {
            e = e || {
                data: {}
            }, e.data.status_code = parseInt(d.join(""));
        },
        function() {
            e = e || {
                data: {}
            }, e.data.reason_phrase = S();
        },
        function() {
            e = e || {
                data: {}
            }, e.data = S();
        },
        function() {
            var d, f;
            for(e = e || {
                data: {}
            }, f = e.data.multi_header.length, d = 0; d < f; d++)if (e.data.multi_header[d].parsed === null) {
                e.data = null;
                break;
            }
            e.data !== null ? e.data = e.data.multi_header : e.data = -1;
        },
        function() {
            var d;
            e = e || {
                data: {}
            }, e.data.multi_header || (e.data.multi_header = []);
            try {
                d = new N(e.data.uri, e.data.displayName, e.data.params), delete e.data.uri, delete e.data.displayName, delete e.data.params;
            } catch  {
                d = null;
            }
            e.data.multi_header.push({
                position: a,
                offset: V().start.offset,
                parsed: d
            });
        },
        function(d) {
            d = S().trim(), d[0] === '"' && (d = d.substring(1, d.length - 1)), e = e || {
                data: {}
            }, e.data.displayName = d;
        },
        "q",
        p("q", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.params || (e.data.params = {}), e.data.params.q = d;
        },
        "expires",
        p("expires", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.params || (e.data.params = {}), e.data.params.expires = d;
        },
        function(d) {
            return parseInt(d.join(""));
        },
        "0",
        p("0", !1),
        function() {
            return parseFloat(S());
        },
        function(d, f) {
            e = e || {
                data: {}
            }, e.data.params || (e.data.params = {}), f === null ? f = void 0 : f = f[1], e.data.params[d.toLowerCase()] = f;
        },
        "render",
        p("render", !0),
        "session",
        p("session", !0),
        "icon",
        p("icon", !0),
        "alert",
        p("alert", !0),
        function() {
            e = e || {
                data: {}
            }, e.startRule === "Content_Disposition" && (e.data.type = S().toLowerCase());
        },
        "handling",
        p("handling", !0),
        "optional",
        p("optional", !0),
        "required",
        p("required", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data = parseInt(d.join(""));
        },
        function() {
            e = e || {
                data: {}
            }, e.data = S();
        },
        "text",
        p("text", !0),
        "image",
        p("image", !0),
        "audio",
        p("audio", !0),
        "video",
        p("video", !0),
        "application",
        p("application", !0),
        "message",
        p("message", !0),
        "multipart",
        p("multipart", !0),
        "x-",
        p("x-", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.value = parseInt(d.join(""));
        },
        function(d) {
            e = e || {
                data: {}
            }, e.data = d;
        },
        function(d) {
            e = e || {
                data: {}
            }, e.data.event = d.toLowerCase();
        },
        function() {
            e = e || {
                data: {}
            };
            var d = e.data.tag;
            e.data = new N(e.data.uri, e.data.displayName, e.data.params), d && e.data.setParam("tag", d);
        },
        "tag",
        p("tag", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.tag = d;
        },
        function(d) {
            e = e || {
                data: {}
            }, e.data = parseInt(d.join(""));
        },
        function(d) {
            e = e || {
                data: {}
            }, e.data = d;
        },
        function() {
            e = e || {
                data: {}
            }, e.data = new N(e.data.uri, e.data.displayName, e.data.params);
        },
        "digest",
        p("Digest", !0),
        "realm",
        p("realm", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.realm = d;
        },
        "domain",
        p("domain", !0),
        "nonce",
        p("nonce", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.nonce = d;
        },
        "opaque",
        p("opaque", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.opaque = d;
        },
        "stale",
        p("stale", !0),
        "true",
        p("true", !0),
        function() {
            e = e || {
                data: {}
            }, e.data.stale = !0;
        },
        "false",
        p("false", !0),
        function() {
            e = e || {
                data: {}
            }, e.data.stale = !1;
        },
        "algorithm",
        p("algorithm", !0),
        "md5",
        p("MD5", !0),
        "md5-sess",
        p("MD5-sess", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.algorithm = d.toUpperCase();
        },
        "qop",
        p("qop", !0),
        "auth-int",
        p("auth-int", !0),
        "auth",
        p("auth", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.qop || (e.data.qop = []), e.data.qop.push(d.toLowerCase());
        },
        function(d) {
            e = e || {
                data: {}
            }, e.data.value = parseInt(d.join(""));
        },
        function() {
            var d, f;
            for(e = e || {
                data: {}
            }, f = e.data.multi_header.length, d = 0; d < f; d++)if (e.data.multi_header[d].parsed === null) {
                e.data = null;
                break;
            }
            e.data !== null ? e.data = e.data.multi_header : e.data = -1;
        },
        function() {
            var d;
            e = e || {
                data: {}
            }, e.data.multi_header || (e.data.multi_header = []);
            try {
                d = new N(e.data.uri, e.data.displayName, e.data.params), delete e.data.uri, delete e.data.displayName, delete e.data.params;
            } catch  {
                d = null;
            }
            e.data.multi_header.push({
                position: a,
                offset: V().start.offset,
                parsed: d
            });
        },
        function() {
            e = e || {
                data: {}
            }, e.data = new N(e.data.uri, e.data.displayName, e.data.params);
        },
        function() {
            e = e || {
                data: {}
            }, e.data.replaces_from_tag && e.data.replaces_to_tag || (e.data = -1);
        },
        function() {
            e = e || {
                data: {}
            }, e.data = {
                call_id: e.data
            };
        },
        "from-tag",
        p("from-tag", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.replaces_from_tag = d;
        },
        "to-tag",
        p("to-tag", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.replaces_to_tag = d;
        },
        "early-only",
        p("early-only", !0),
        function() {
            e = e || {
                data: {}
            }, e.data.early_only = !0;
        },
        function(d, f) {
            return f;
        },
        function(d, f) {
            return Nt(d, f);
        },
        function(d) {
            e = e || {
                data: {}
            }, e.startRule === "Require" && (e.data = d || []);
        },
        function(d) {
            e = e || {
                data: {}
            }, e.data.value = parseInt(d.join(""));
        },
        "active",
        p("active", !0),
        "pending",
        p("pending", !0),
        "terminated",
        p("terminated", !0),
        function() {
            e = e || {
                data: {}
            }, e.data.state = S();
        },
        "reason",
        p("reason", !0),
        function(d) {
            e = e || {
                data: {}
            }, typeof d != "undefined" && (e.data.reason = d);
        },
        function(d) {
            e = e || {
                data: {}
            }, typeof d != "undefined" && (e.data.expires = d);
        },
        "retry_after",
        p("retry_after", !0),
        function(d) {
            e = e || {
                data: {}
            }, typeof d != "undefined" && (e.data.retry_after = d);
        },
        "deactivated",
        p("deactivated", !0),
        "probation",
        p("probation", !0),
        "rejected",
        p("rejected", !0),
        "timeout",
        p("timeout", !0),
        "giveup",
        p("giveup", !0),
        "noresource",
        p("noresource", !0),
        "invariant",
        p("invariant", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.startRule === "Supported" && (e.data = d || []);
        },
        function() {
            e = e || {
                data: {}
            };
            var d = e.data.tag;
            e.data = new N(e.data.uri, e.data.displayName, e.data.params), d && e.data.setParam("tag", d);
        },
        "ttl",
        p("ttl", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.ttl = d;
        },
        "maddr",
        p("maddr", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.maddr = d;
        },
        "received",
        p("received", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.received = d;
        },
        "branch",
        p("branch", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.branch = d;
        },
        "rport",
        p("rport", !0),
        function(d) {
            e = e || {
                data: {}
            }, typeof d != "undefined" && (e.data.rport = d.join(""));
        },
        function(d) {
            e = e || {
                data: {}
            }, e.data.protocol = d;
        },
        p("UDP", !0),
        p("TCP", !0),
        p("TLS", !0),
        p("SCTP", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.transport = d;
        },
        function() {
            e = e || {
                data: {}
            }, e.data.host = S();
        },
        function(d) {
            e = e || {
                data: {}
            }, e.data.port = parseInt(d.join(""));
        },
        function(d) {
            return parseInt(d.join(""));
        },
        function(d) {
            e = e || {
                data: {}
            }, e.startRule === "Session_Expires" && (e.data.deltaSeconds = d);
        },
        "refresher",
        p("refresher", !1),
        "uas",
        p("uas", !1),
        "uac",
        p("uac", !1),
        function(d) {
            e = e || {
                data: {}
            }, e.startRule === "Session_Expires" && (e.data.refresher = d);
        },
        function(d) {
            e = e || {
                data: {}
            }, e.startRule === "Min_SE" && (e.data = d);
        },
        "stuns",
        p("stuns", !0),
        "stun",
        p("stun", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.scheme = d;
        },
        function(d) {
            e = e || {
                data: {}
            }, e.data.host = d;
        },
        "?transport=",
        p("?transport=", !1),
        "turns",
        p("turns", !0),
        "turn",
        p("turn", !0),
        function(d) {
            e = e || {
                data: {}
            }, e.data.transport = d;
        },
        function() {
            e = e || {
                data: {}
            }, e.data = S();
        },
        "Referred-By",
        p("Referred-By", !1),
        "b",
        p("b", !1),
        "cid",
        p("cid", !1)
    ], n = [
        c('2 ""6 7!'),
        c('4"""5!7#'),
        c('4$""5!7%'),
        c(`4&""5!7'`),
        c(";'.# &;("),
        c('4(""5!7)'),
        c('4*""5!7+'),
        c('2,""6,7-'),
        c('2.""6.7/'),
        c('40""5!71'),
        c('22""6273.\x89 &24""6475.} &26""6677.q &28""6879.e &2:""6:7;.Y &2<""6<7=.M &2>""6>7?.A &2@""6@7A.5 &2B""6B7C.) &2D""6D7E'),
        c(";).# &;,"),
        c('2F""6F7G.} &2H""6H7I.q &2J""6J7K.e &2L""6L7M.Y &2N""6N7O.M &2P""6P7Q.A &2R""6R7S.5 &2T""6T7U.) &2V""6V7W'),
        c(`%%2X""6X7Y/5#;#/,$;#/#$+#)(#'#("'#&'#/"!&,)`),
        c(`%%$;$0#*;$&/,#; /#$+")("'#&'#." &"/=#$;$/&#0#*;$&&&#/'$8":Z" )("'#&'#`),
        c(';.." &"'),
        c(`%$;'.# &;(0)*;'.# &;(&/?#28""6879/0$;//'$8#:[# )(#'#("'#&'#`),
        c(`%%$;2/&#0#*;2&&&#/g#$%$;.0#*;.&/,#;2/#$+")("'#&'#0=*%$;.0#*;.&/,#;2/#$+")("'#&'#&/#$+")("'#&'#/"!&,)`),
        c('4\\""5!7].# &;3'),
        c('4^""5!7_'),
        c('4`""5!7a'),
        c(';!.) &4b""5!7c'),
        c('%$;).\x95 &2F""6F7G.\x89 &2J""6J7K.} &2L""6L7M.q &2X""6X7Y.e &2P""6P7Q.Y &2H""6H7I.M &2@""6@7A.A &2d""6d7e.5 &2R""6R7S.) &2N""6N7O/\x9E#0\x9B*;).\x95 &2F""6F7G.\x89 &2J""6J7K.} &2L""6L7M.q &2X""6X7Y.e &2P""6P7Q.Y &2H""6H7I.M &2@""6@7A.A &2d""6d7e.5 &2R""6R7S.) &2N""6N7O&&&#/"!&,)'),
        c('%$;).\x89 &2F""6F7G.} &2L""6L7M.q &2X""6X7Y.e &2P""6P7Q.Y &2H""6H7I.M &2@""6@7A.A &2d""6d7e.5 &2R""6R7S.) &2N""6N7O/\x92#0\x8F*;).\x89 &2F""6F7G.} &2L""6L7M.q &2X""6X7Y.e &2P""6P7Q.Y &2H""6H7I.M &2@""6@7A.A &2d""6d7e.5 &2R""6R7S.) &2N""6N7O&&&#/"!&,)'),
        c(`2T""6T7U.\xE3 &2V""6V7W.\xD7 &2f""6f7g.\xCB &2h""6h7i.\xBF &2:""6:7;.\xB3 &2D""6D7E.\xA7 &22""6273.\x9B &28""6879.\x8F &2j""6j7k.\x83 &;&.} &24""6475.q &2l""6l7m.e &2n""6n7o.Y &26""6677.M &2>""6>7?.A &2p""6p7q.5 &2r""6r7s.) &;'.# &;(`),
        c('%$;).\u012B &2F""6F7G.\u011F &2J""6J7K.\u0113 &2L""6L7M.\u0107 &2X""6X7Y.\xFB &2P""6P7Q.\xEF &2H""6H7I.\xE3 &2@""6@7A.\xD7 &2d""6d7e.\xCB &2R""6R7S.\xBF &2N""6N7O.\xB3 &2T""6T7U.\xA7 &2V""6V7W.\x9B &2f""6f7g.\x8F &2h""6h7i.\x83 &28""6879.w &2j""6j7k.k &;&.e &24""6475.Y &2l""6l7m.M &2n""6n7o.A &26""6677.5 &2p""6p7q.) &2r""6r7s/\u0134#0\u0131*;).\u012B &2F""6F7G.\u011F &2J""6J7K.\u0113 &2L""6L7M.\u0107 &2X""6X7Y.\xFB &2P""6P7Q.\xEF &2H""6H7I.\xE3 &2@""6@7A.\xD7 &2d""6d7e.\xCB &2R""6R7S.\xBF &2N""6N7O.\xB3 &2T""6T7U.\xA7 &2V""6V7W.\x9B &2f""6f7g.\x8F &2h""6h7i.\x83 &28""6879.w &2j""6j7k.k &;&.e &24""6475.Y &2l""6l7m.M &2n""6n7o.A &26""6677.5 &2p""6p7q.) &2r""6r7s&&&#/"!&,)'),
        c(`%;//?#2P""6P7Q/0$;//'$8#:t# )(#'#("'#&'#`),
        c(`%;//?#24""6475/0$;//'$8#:u# )(#'#("'#&'#`),
        c(`%;//?#2>""6>7?/0$;//'$8#:v# )(#'#("'#&'#`),
        c(`%;//?#2T""6T7U/0$;//'$8#:w# )(#'#("'#&'#`),
        c(`%;//?#2V""6V7W/0$;//'$8#:x# )(#'#("'#&'#`),
        c(`%2h""6h7i/0#;//'$8":y" )("'#&'#`),
        c(`%;//6#2f""6f7g/'$8":z" )("'#&'#`),
        c(`%;//?#2D""6D7E/0$;//'$8#:{# )(#'#("'#&'#`),
        c(`%;//?#22""6273/0$;//'$8#:|# )(#'#("'#&'#`),
        c(`%;//?#28""6879/0$;//'$8#:}# )(#'#("'#&'#`),
        c(`%;//0#;&/'$8":~" )("'#&'#`),
        c(`%;&/0#;//'$8":~" )("'#&'#`),
        c(`%;=/T#$;G.) &;K.# &;F0/*;G.) &;K.# &;F&/,$;>/#$+#)(#'#("'#&'#`),
        c('4\x7F""5!7\x80.A &4\x81""5!7\x82.5 &4\x83""5!7\x84.) &;3.# &;.'),
        c(`%%;//Q#;&/H$$;J.# &;K0)*;J.# &;K&/,$;&/#$+$)($'#(#'#("'#&'#/"!&,)`),
        c(`%;//]#;&/T$%$;J.# &;K0)*;J.# &;K&/"!&,)/1$;&/($8$:\x85$!!)($'#(#'#("'#&'#`),
        c(';..G &2L""6L7M.; &4\x86""5!7\x87./ &4\x83""5!7\x84.# &;3'),
        c(`%2j""6j7k/J#4\x88""5!7\x89.5 &4\x8A""5!7\x8B.) &4\x8C""5!7\x8D/#$+")("'#&'#`),
        c(`%;N/M#28""6879/>$;O." &"/0$;S/'$8$:\x8E$ )($'#(#'#("'#&'#`),
        c(`%;N/d#28""6879/U$;O." &"/G$;S/>$;_/5$;l." &"/'$8&:\x8F& )(&'#(%'#($'#(#'#("'#&'#`),
        c(`%3\x90""5$7\x91.) &3\x92""5#7\x93/' 8!:\x94!! )`),
        c(`%;P/]#%28""6879/,#;R/#$+")("'#&'#." &"/6$2:""6:7;/'$8#:\x95# )(#'#("'#&'#`),
        c("$;+.) &;-.# &;Q/2#0/*;+.) &;-.# &;Q&&&#"),
        c('2<""6<7=.q &2>""6>7?.e &2@""6@7A.Y &2B""6B7C.M &2D""6D7E.A &22""6273.5 &26""6677.) &24""6475'),
        c('%$;+._ &;-.Y &2<""6<7=.M &2>""6>7?.A &2@""6@7A.5 &2B""6B7C.) &2D""6D7E0e*;+._ &;-.Y &2<""6<7=.M &2>""6>7?.A &2@""6@7A.5 &2B""6B7C.) &2D""6D7E&/& 8!:\x96! )'),
        c(`%;T/J#%28""6879/,#;^/#$+")("'#&'#." &"/#$+")("'#&'#`),
        c("%;U.) &;\\.# &;X/& 8!:\x97! )"),
        c(`%$%;V/2#2J""6J7K/#$+")("'#&'#0<*%;V/2#2J""6J7K/#$+")("'#&'#&/D#;W/;$2J""6J7K." &"/'$8#:\x98# )(#'#("'#&'#`),
        c('$4\x99""5!7\x9A/,#0)*4\x99""5!7\x9A&&&#'),
        c(`%4$""5!7%/?#$4\x9B""5!7\x9C0)*4\x9B""5!7\x9C&/#$+")("'#&'#`),
        c(`%2l""6l7m/?#;Y/6$2n""6n7o/'$8#:\x9D# )(#'#("'#&'#`),
        c(`%%;Z/\xB3#28""6879/\xA4$;Z/\x9B$28""6879/\x8C$;Z/\x83$28""6879/t$;Z/k$28""6879/\\$;Z/S$28""6879/D$;Z/;$28""6879/,$;[/#$+-)(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#("'#&'#.\u0790 &%2\x9E""6\x9E7\x9F/\xA4#;Z/\x9B$28""6879/\x8C$;Z/\x83$28""6879/t$;Z/k$28""6879/\\$;Z/S$28""6879/D$;Z/;$28""6879/,$;[/#$+,)(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#("'#&'#.\u06F9 &%2\x9E""6\x9E7\x9F/\x8C#;Z/\x83$28""6879/t$;Z/k$28""6879/\\$;Z/S$28""6879/D$;Z/;$28""6879/,$;[/#$+*)(*'#()'#(('#(''#(&'#(%'#($'#(#'#("'#&'#.\u067A &%2\x9E""6\x9E7\x9F/t#;Z/k$28""6879/\\$;Z/S$28""6879/D$;Z/;$28""6879/,$;[/#$+()(('#(''#(&'#(%'#($'#(#'#("'#&'#.\u0613 &%2\x9E""6\x9E7\x9F/\\#;Z/S$28""6879/D$;Z/;$28""6879/,$;[/#$+&)(&'#(%'#($'#(#'#("'#&'#.\u05C4 &%2\x9E""6\x9E7\x9F/D#;Z/;$28""6879/,$;[/#$+$)($'#(#'#("'#&'#.\u058D &%2\x9E""6\x9E7\x9F/,#;[/#$+")("'#&'#.\u056E &%2\x9E""6\x9E7\x9F/,#;Z/#$+")("'#&'#.\u054F &%;Z/\x9B#2\x9E""6\x9E7\x9F/\x8C$;Z/\x83$28""6879/t$;Z/k$28""6879/\\$;Z/S$28""6879/D$;Z/;$28""6879/,$;[/#$++)(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#("'#&'#.\u04C7 &%;Z/\xAA#%28""6879/,#;Z/#$+")("'#&'#." &"/\x83$2\x9E""6\x9E7\x9F/t$;Z/k$28""6879/\\$;Z/S$28""6879/D$;Z/;$28""6879/,$;[/#$+*)(*'#()'#(('#(''#(&'#(%'#($'#(#'#("'#&'#.\u0430 &%;Z/\xB9#%28""6879/,#;Z/#$+")("'#&'#." &"/\x92$%28""6879/,#;Z/#$+")("'#&'#." &"/k$2\x9E""6\x9E7\x9F/\\$;Z/S$28""6879/D$;Z/;$28""6879/,$;[/#$+))()'#(('#(''#(&'#(%'#($'#(#'#("'#&'#.\u038A &%;Z/\xC8#%28""6879/,#;Z/#$+")("'#&'#." &"/\xA1$%28""6879/,#;Z/#$+")("'#&'#." &"/z$%28""6879/,#;Z/#$+")("'#&'#." &"/S$2\x9E""6\x9E7\x9F/D$;Z/;$28""6879/,$;[/#$+()(('#(''#(&'#(%'#($'#(#'#("'#&'#.\u02D5 &%;Z/\xD7#%28""6879/,#;Z/#$+")("'#&'#." &"/\xB0$%28""6879/,#;Z/#$+")("'#&'#." &"/\x89$%28""6879/,#;Z/#$+")("'#&'#." &"/b$%28""6879/,#;Z/#$+")("'#&'#." &"/;$2\x9E""6\x9E7\x9F/,$;[/#$+')(''#(&'#(%'#($'#(#'#("'#&'#.\u0211 &%;Z/\xFE#%28""6879/,#;Z/#$+")("'#&'#." &"/\xD7$%28""6879/,#;Z/#$+")("'#&'#." &"/\xB0$%28""6879/,#;Z/#$+")("'#&'#." &"/\x89$%28""6879/,#;Z/#$+")("'#&'#." &"/b$%28""6879/,#;Z/#$+")("'#&'#." &"/;$2\x9E""6\x9E7\x9F/,$;Z/#$+()(('#(''#(&'#(%'#($'#(#'#("'#&'#.\u0126 &%;Z/\u011C#%28""6879/,#;Z/#$+")("'#&'#." &"/\xF5$%28""6879/,#;Z/#$+")("'#&'#." &"/\xCE$%28""6879/,#;Z/#$+")("'#&'#." &"/\xA7$%28""6879/,#;Z/#$+")("'#&'#." &"/\x80$%28""6879/,#;Z/#$+")("'#&'#." &"/Y$%28""6879/,#;Z/#$+")("'#&'#." &"/2$2\x9E""6\x9E7\x9F/#$+()(('#(''#(&'#(%'#($'#(#'#("'#&'#/& 8!:\xA0! )`),
        c(`%;#/M#;#." &"/?$;#." &"/1$;#." &"/#$+$)($'#(#'#("'#&'#`),
        c(`%;Z/;#28""6879/,$;Z/#$+#)(#'#("'#&'#.# &;\\`),
        c(`%;]/o#2J""6J7K/\`$;]/W$2J""6J7K/H$;]/?$2J""6J7K/0$;]/'$8':\xA1' )(''#(&'#(%'#($'#(#'#("'#&'#`),
        c(`%2\xA2""6\xA27\xA3/2#4\xA4""5!7\xA5/#$+")("'#&'#.\x98 &%2\xA6""6\xA67\xA7/;#4\xA8""5!7\xA9/,$;!/#$+#)(#'#("'#&'#.j &%2\xAA""6\xAA7\xAB/5#;!/,$;!/#$+#)(#'#("'#&'#.B &%4\xAC""5!7\xAD/,#;!/#$+")("'#&'#.# &;!`),
        c(`%%;!." &"/[#;!." &"/M$;!." &"/?$;!." &"/1$;!." &"/#$+%)(%'#($'#(#'#("'#&'#/' 8!:\xAE!! )`),
        c(`$%22""6273/,#;\`/#$+")("'#&'#0<*%22""6273/,#;\`/#$+")("'#&'#&`),
        c(";a.A &;b.; &;c.5 &;d./ &;e.) &;f.# &;g"),
        c(`%3\xAF""5*7\xB0/a#3\xB1""5#7\xB2.G &3\xB3""5#7\xB4.; &3\xB5""5$7\xB6./ &3\xB7""5#7\xB8.# &;6/($8":\xB9"! )("'#&'#`),
        c(`%3\xBA""5%7\xBB/I#3\xBC""5%7\xBD./ &3\xBE""5"7\xBF.# &;6/($8":\xC0"! )("'#&'#`),
        c(`%3\xC1""5'7\xC2/1#;\x90/($8":\xC3"! )("'#&'#`),
        c(`%3\xC4""5$7\xC5/1#;\xF0/($8":\xC6"! )("'#&'#`),
        c(`%3\xC7""5&7\xC8/1#;T/($8":\xC9"! )("'#&'#`),
        c(`%3\xCA""5"7\xCB/N#%2>""6>7?/,#;6/#$+")("'#&'#." &"/'$8":\xCC" )("'#&'#`),
        c(`%;h/P#%2>""6>7?/,#;i/#$+")("'#&'#." &"/)$8":\xCD""! )("'#&'#`),
        c('%$;j/&#0#*;j&&&#/"!&,)'),
        c('%$;j/&#0#*;j&&&#/"!&,)'),
        c(";k.) &;+.# &;-"),
        c('2l""6l7m.e &2n""6n7o.Y &24""6475.M &28""6879.A &2<""6<7=.5 &2@""6@7A.) &2B""6B7C'),
        c(`%26""6677/n#;m/e$$%2<""6<7=/,#;m/#$+")("'#&'#0<*%2<""6<7=/,#;m/#$+")("'#&'#&/#$+#)(#'#("'#&'#`),
        c(`%;n/A#2>""6>7?/2$;o/)$8#:\xCE#"" )(#'#("'#&'#`),
        c("$;p.) &;+.# &;-/2#0/*;p.) &;+.# &;-&&&#"),
        c("$;p.) &;+.# &;-0/*;p.) &;+.# &;-&"),
        c('2l""6l7m.e &2n""6n7o.Y &24""6475.M &26""6677.A &28""6879.5 &2@""6@7A.) &2B""6B7C'),
        c(";\x91.# &;r"),
        c(`%;\x90/G#;'/>$;s/5$;'/,$;\x84/#$+%)(%'#($'#(#'#("'#&'#`),
        c(";M.# &;t"),
        c(`%;\x7F/E#28""6879/6$;u.# &;x/'$8#:\xCF# )(#'#("'#&'#`),
        c(`%;v.# &;w/J#%26""6677/,#;\x83/#$+")("'#&'#." &"/#$+")("'#&'#`),
        c(`%2\xD0""6\xD07\xD1/:#;\x80/1$;w." &"/#$+#)(#'#("'#&'#`),
        c(`%24""6475/,#;{/#$+")("'#&'#`),
        c(`%;z/3#$;y0#*;y&/#$+")("'#&'#`),
        c(";*.) &;+.# &;-"),
        c(';+.\x8F &;-.\x89 &22""6273.} &26""6677.q &28""6879.e &2:""6:7;.Y &2<""6<7=.M &2>""6>7?.A &2@""6@7A.5 &2B""6B7C.) &2D""6D7E'),
        c(`%;|/e#$%24""6475/,#;|/#$+")("'#&'#0<*%24""6475/,#;|/#$+")("'#&'#&/#$+")("'#&'#`),
        c(`%$;~0#*;~&/e#$%22""6273/,#;}/#$+")("'#&'#0<*%22""6273/,#;}/#$+")("'#&'#&/#$+")("'#&'#`),
        c("$;~0#*;~&"),
        c(';+.w &;-.q &28""6879.e &2:""6:7;.Y &2<""6<7=.M &2>""6>7?.A &2@""6@7A.5 &2B""6B7C.) &2D""6D7E'),
        c(`%%;"/\x87#$;".G &;!.A &2@""6@7A.5 &2F""6F7G.) &2J""6J7K0M*;".G &;!.A &2@""6@7A.5 &2F""6F7G.) &2J""6J7K&/#$+")("'#&'#/& 8!:\xD2! )`),
        c(";\x81.# &;\x82"),
        c(`%%;O/2#2:""6:7;/#$+")("'#&'#." &"/,#;S/#$+")("'#&'#." &"`),
        c('$;+.\x83 &;-.} &2B""6B7C.q &2D""6D7E.e &22""6273.Y &28""6879.M &2:""6:7;.A &2<""6<7=.5 &2>""6>7?.) &2@""6@7A/\x8C#0\x89*;+.\x83 &;-.} &2B""6B7C.q &2D""6D7E.e &22""6273.Y &28""6879.M &2:""6:7;.A &2<""6<7=.5 &2>""6>7?.) &2@""6@7A&&&#'),
        c("$;y0#*;y&"),
        c(`%3\x92""5#7\xD3/q#24""6475/b$$;!/&#0#*;!&&&#/L$2J""6J7K/=$$;!/&#0#*;!&&&#/'$8%:\xD4% )(%'#($'#(#'#("'#&'#`),
        c('2\xD5""6\xD57\xD6'),
        c('2\xD7""6\xD77\xD8'),
        c('2\xD9""6\xD97\xDA'),
        c('2\xDB""6\xDB7\xDC'),
        c('2\xDD""6\xDD7\xDE'),
        c('2\xDF""6\xDF7\xE0'),
        c('2\xE1""6\xE17\xE2'),
        c('2\xE3""6\xE37\xE4'),
        c('2\xE5""6\xE57\xE6'),
        c('2\xE7""6\xE77\xE8'),
        c('2\xE9""6\xE97\xEA'),
        c("%;\x85.Y &;\x86.S &;\x88.M &;\x89.G &;\x8A.A &;\x8B.; &;\x8C.5 &;\x8F./ &;\x8D.) &;\x8E.# &;6/& 8!:\xEB! )"),
        c(`%;\x84/G#;'/>$;\x92/5$;'/,$;\x94/#$+%)(%'#($'#(#'#("'#&'#`),
        c("%;\x93/' 8!:\xEC!! )"),
        c(`%;!/5#;!/,$;!/#$+#)(#'#("'#&'#`),
        c("%$;*.A &;+.; &;-.5 &;3./ &;4.) &;'.# &;(0G*;*.A &;+.; &;-.5 &;3./ &;4.) &;'.# &;(&/& 8!:\xED! )"),
        c(`%;\xB6/Y#$%;A/,#;\xB6/#$+")("'#&'#06*%;A/,#;\xB6/#$+")("'#&'#&/#$+")("'#&'#`),
        c(`%;9/N#%2:""6:7;/,#;9/#$+")("'#&'#." &"/'$8":\xEE" )("'#&'#`),
        c(`%;:.c &%;\x98/Y#$%;A/,#;\x98/#$+")("'#&'#06*%;A/,#;\x98/#$+")("'#&'#&/#$+")("'#&'#/& 8!:\xEF! )`),
        c(`%;L.# &;\x99/]#$%;B/,#;\x9B/#$+")("'#&'#06*%;B/,#;\x9B/#$+")("'#&'#&/'$8":\xF0" )("'#&'#`),
        c(`%;\x9A." &"/>#;@/5$;M/,$;?/#$+$)($'#(#'#("'#&'#`),
        c(`%%;6/Y#$%;./,#;6/#$+")("'#&'#06*%;./,#;6/#$+")("'#&'#&/#$+")("'#&'#.# &;H/' 8!:\xF1!! )`),
        c(";\x9C.) &;\x9D.# &;\xA0"),
        c(`%3\xF2""5!7\xF3/:#;</1$;\x9F/($8#:\xF4#! )(#'#("'#&'#`),
        c(`%3\xF5""5'7\xF6/:#;</1$;\x9E/($8#:\xF7#! )(#'#("'#&'#`),
        c("%$;!/&#0#*;!&&&#/' 8!:\xF8!! )"),
        c(`%2\xF9""6\xF97\xFA/o#%2J""6J7K/M#;!." &"/?$;!." &"/1$;!." &"/#$+$)($'#(#'#("'#&'#." &"/'$8":\xFB" )("'#&'#`),
        c(`%;6/J#%;</,#;\xA1/#$+")("'#&'#." &"/)$8":\xFC""! )("'#&'#`),
        c(";6.) &;T.# &;H"),
        c(`%;\xA3/Y#$%;B/,#;\xA4/#$+")("'#&'#06*%;B/,#;\xA4/#$+")("'#&'#&/#$+")("'#&'#`),
        c(`%3\xFD""5&7\xFE.G &3\xFF""5'7\u0100.; &3\u0101""5$7\u0102./ &3\u0103""5%7\u0104.# &;6/& 8!:\u0105! )`),
        c(";\xA5.# &;\xA0"),
        c(`%3\u0106""5(7\u0107/M#;</D$3\u0108""5(7\u0109./ &3\u010A""5(7\u010B.# &;6/#$+#)(#'#("'#&'#`),
        c(`%;6/Y#$%;A/,#;6/#$+")("'#&'#06*%;A/,#;6/#$+")("'#&'#&/#$+")("'#&'#`),
        c("%$;!/&#0#*;!&&&#/' 8!:\u010C!! )"),
        c("%;\xA9/& 8!:\u010D! )"),
        c(`%;\xAA/k#;;/b$;\xAF/Y$$%;B/,#;\xB0/#$+")("'#&'#06*%;B/,#;\xB0/#$+")("'#&'#&/#$+$)($'#(#'#("'#&'#`),
        c(";\xAB.# &;\xAC"),
        c('3\u010E""5$7\u010F.S &3\u0110""5%7\u0111.G &3\u0112""5%7\u0113.; &3\u0114""5%7\u0115./ &3\u0116""5+7\u0117.# &;\xAD'),
        c(`3\u0118""5'7\u0119./ &3\u011A""5)7\u011B.# &;\xAD`),
        c(";6.# &;\xAE"),
        c(`%3\u011C""5"7\u011D/,#;6/#$+")("'#&'#`),
        c(";\xAD.# &;6"),
        c(`%;6/5#;</,$;\xB1/#$+#)(#'#("'#&'#`),
        c(";6.# &;H"),
        c(`%;\xB3/5#;./,$;\x90/#$+#)(#'#("'#&'#`),
        c("%$;!/&#0#*;!&&&#/' 8!:\u011E!! )"),
        c("%;\x9E/' 8!:\u011F!! )"),
        c(`%;\xB6/^#$%;B/,#;\xA0/#$+")("'#&'#06*%;B/,#;\xA0/#$+")("'#&'#&/($8":\u0120"!!)("'#&'#`),
        c(`%%;7/e#$%2J""6J7K/,#;7/#$+")("'#&'#0<*%2J""6J7K/,#;7/#$+")("'#&'#&/#$+")("'#&'#/"!&,)`),
        c(`%;L.# &;\x99/]#$%;B/,#;\xB8/#$+")("'#&'#06*%;B/,#;\xB8/#$+")("'#&'#&/'$8":\u0121" )("'#&'#`),
        c(";\xB9.# &;\xA0"),
        c(`%3\u0122""5#7\u0123/:#;</1$;6/($8#:\u0124#! )(#'#("'#&'#`),
        c("%$;!/&#0#*;!&&&#/' 8!:\u0125!! )"),
        c("%;\x9E/' 8!:\u0126!! )"),
        c(`%$;\x9A0#*;\x9A&/x#;@/o$;M/f$;?/]$$%;B/,#;\xA0/#$+")("'#&'#06*%;B/,#;\xA0/#$+")("'#&'#&/'$8%:\u0127% )(%'#($'#(#'#("'#&'#`),
        c(";\xBE"),
        c(`%3\u0128""5&7\u0129/k#;./b$;\xC1/Y$$%;A/,#;\xC1/#$+")("'#&'#06*%;A/,#;\xC1/#$+")("'#&'#&/#$+$)($'#(#'#("'#&'#.# &;\xBF`),
        c(`%;6/k#;./b$;\xC0/Y$$%;A/,#;\xC0/#$+")("'#&'#06*%;A/,#;\xC0/#$+")("'#&'#&/#$+$)($'#(#'#("'#&'#`),
        c(`%;6/;#;</2$;6.# &;H/#$+#)(#'#("'#&'#`),
        c(";\xC2.G &;\xC4.A &;\xC6.; &;\xC8.5 &;\xC9./ &;\xCA.) &;\xCB.# &;\xC0"),
        c(`%3\u012A""5%7\u012B/5#;</,$;\xC3/#$+#)(#'#("'#&'#`),
        c("%;I/' 8!:\u012C!! )"),
        c(`%3\u012D""5&7\u012E/\x97#;</\x8E$;D/\x85$;\xC5/|$$%$;'/&#0#*;'&&&#/,#;\xC5/#$+")("'#&'#0C*%$;'/&#0#*;'&&&#/,#;\xC5/#$+")("'#&'#&/,$;E/#$+&)(&'#(%'#($'#(#'#("'#&'#`),
        c(";t.# &;w"),
        c(`%3\u012F""5%7\u0130/5#;</,$;\xC7/#$+#)(#'#("'#&'#`),
        c("%;I/' 8!:\u0131!! )"),
        c(`%3\u0132""5&7\u0133/:#;</1$;I/($8#:\u0134#! )(#'#("'#&'#`),
        c(`%3\u0135""5%7\u0136/]#;</T$%3\u0137""5$7\u0138/& 8!:\u0139! ).4 &%3\u013A""5%7\u013B/& 8!:\u013C! )/#$+#)(#'#("'#&'#`),
        c(`%3\u013D""5)7\u013E/R#;</I$3\u013F""5#7\u0140./ &3\u0141""5(7\u0142.# &;6/($8#:\u0143#! )(#'#("'#&'#`),
        c(`%3\u0144""5#7\u0145/\x93#;</\x8A$;D/\x81$%;\xCC/e#$%2D""6D7E/,#;\xCC/#$+")("'#&'#0<*%2D""6D7E/,#;\xCC/#$+")("'#&'#&/#$+")("'#&'#/,$;E/#$+%)(%'#($'#(#'#("'#&'#`),
        c(`%3\u0146""5(7\u0147./ &3\u0148""5$7\u0149.# &;6/' 8!:\u014A!! )`),
        c(`%;6/Y#$%;A/,#;6/#$+")("'#&'#06*%;A/,#;6/#$+")("'#&'#&/#$+")("'#&'#`),
        c(`%;\xCF/G#;./>$;\xCF/5$;./,$;\x90/#$+%)(%'#($'#(#'#("'#&'#`),
        c("%$;!/&#0#*;!&&&#/' 8!:\u014B!! )"),
        c(`%;\xD1/]#$%;A/,#;\xD1/#$+")("'#&'#06*%;A/,#;\xD1/#$+")("'#&'#&/'$8":\u014C" )("'#&'#`),
        c(`%;\x99/]#$%;B/,#;\xA0/#$+")("'#&'#06*%;B/,#;\xA0/#$+")("'#&'#&/'$8":\u014D" )("'#&'#`),
        c(`%;L.O &;\x99.I &%;@." &"/:#;t/1$;?." &"/#$+#)(#'#("'#&'#/]#$%;B/,#;\xA0/#$+")("'#&'#06*%;B/,#;\xA0/#$+")("'#&'#&/'$8":\u014E" )("'#&'#`),
        c(`%;\xD4/]#$%;B/,#;\xD5/#$+")("'#&'#06*%;B/,#;\xD5/#$+")("'#&'#&/'$8":\u014F" )("'#&'#`),
        c("%;\x96/& 8!:\u0150! )"),
        c(`%3\u0151""5(7\u0152/:#;</1$;6/($8#:\u0153#! )(#'#("'#&'#.g &%3\u0154""5&7\u0155/:#;</1$;6/($8#:\u0156#! )(#'#("'#&'#.: &%3\u0157""5*7\u0158/& 8!:\u0159! ).# &;\xA0`),
        c(`%%;6/k#$%;A/2#;6/)$8":\u015A""$ )("'#&'#0<*%;A/2#;6/)$8":\u015A""$ )("'#&'#&/)$8":\u015B""! )("'#&'#." &"/' 8!:\u015C!! )`),
        c(`%;\xD8/Y#$%;A/,#;\xD8/#$+")("'#&'#06*%;A/,#;\xD8/#$+")("'#&'#&/#$+")("'#&'#`),
        c(`%;\x99/Y#$%;B/,#;\xA0/#$+")("'#&'#06*%;B/,#;\xA0/#$+")("'#&'#&/#$+")("'#&'#`),
        c("%$;!/&#0#*;!&&&#/' 8!:\u015D!! )"),
        c(`%;\xDB/Y#$%;B/,#;\xDC/#$+")("'#&'#06*%;B/,#;\xDC/#$+")("'#&'#&/#$+")("'#&'#`),
        c(`%3\u015E""5&7\u015F.; &3\u0160""5'7\u0161./ &3\u0162""5*7\u0163.# &;6/& 8!:\u0164! )`),
        c(`%3\u0165""5&7\u0166/:#;</1$;\xDD/($8#:\u0167#! )(#'#("'#&'#.} &%3\xF5""5'7\xF6/:#;</1$;\x9E/($8#:\u0168#! )(#'#("'#&'#.P &%3\u0169""5+7\u016A/:#;</1$;\x9E/($8#:\u016B#! )(#'#("'#&'#.# &;\xA0`),
        c(`3\u016C""5+7\u016D.k &3\u016E""5)7\u016F._ &3\u0170""5(7\u0171.S &3\u0172""5'7\u0173.G &3\u0174""5&7\u0175.; &3\u0176""5*7\u0177./ &3\u0178""5)7\u0179.# &;6`),
        c(';1." &"'),
        c(`%%;6/k#$%;A/2#;6/)$8":\u015A""$ )("'#&'#0<*%;A/2#;6/)$8":\u015A""$ )("'#&'#&/)$8":\u015B""! )("'#&'#." &"/' 8!:\u017A!! )`),
        c(`%;L.# &;\x99/]#$%;B/,#;\xE1/#$+")("'#&'#06*%;B/,#;\xE1/#$+")("'#&'#&/'$8":\u017B" )("'#&'#`),
        c(";\xB9.# &;\xA0"),
        c(`%;\xE3/Y#$%;A/,#;\xE3/#$+")("'#&'#06*%;A/,#;\xE3/#$+")("'#&'#&/#$+")("'#&'#`),
        c(`%;\xEA/k#;./b$;\xED/Y$$%;B/,#;\xE4/#$+")("'#&'#06*%;B/,#;\xE4/#$+")("'#&'#&/#$+$)($'#(#'#("'#&'#`),
        c(";\xE5.; &;\xE6.5 &;\xE7./ &;\xE8.) &;\xE9.# &;\xA0"),
        c(`%3\u017C""5#7\u017D/:#;</1$;\xF0/($8#:\u017E#! )(#'#("'#&'#`),
        c(`%3\u017F""5%7\u0180/:#;</1$;T/($8#:\u0181#! )(#'#("'#&'#`),
        c(`%3\u0182""5(7\u0183/F#;</=$;\\.) &;Y.# &;X/($8#:\u0184#! )(#'#("'#&'#`),
        c(`%3\u0185""5&7\u0186/:#;</1$;6/($8#:\u0187#! )(#'#("'#&'#`),
        c(`%3\u0188""5%7\u0189/A#;</8$$;!0#*;!&/($8#:\u018A#! )(#'#("'#&'#`),
        c(`%;\xEB/G#;;/>$;6/5$;;/,$;\xEC/#$+%)(%'#($'#(#'#("'#&'#`),
        c(`%3\x92""5#7\xD3.# &;6/' 8!:\u018B!! )`),
        c(`%3\xB1""5#7\u018C.G &3\xB3""5#7\u018D.; &3\xB7""5#7\u018E./ &3\xB5""5$7\u018F.# &;6/' 8!:\u0190!! )`),
        c(`%;\xEE/D#%;C/,#;\xEF/#$+")("'#&'#." &"/#$+")("'#&'#`),
        c("%;U.) &;\\.# &;X/& 8!:\u0191! )"),
        c(`%%;!." &"/[#;!." &"/M$;!." &"/?$;!." &"/1$;!." &"/#$+%)(%'#($'#(#'#("'#&'#/' 8!:\u0192!! )`),
        c(`%%;!/?#;!." &"/1$;!." &"/#$+#)(#'#("'#&'#/' 8!:\u0193!! )`),
        c(";\xBE"),
        c(`%;\x9E/^#$%;B/,#;\xF3/#$+")("'#&'#06*%;B/,#;\xF3/#$+")("'#&'#&/($8":\u0194"!!)("'#&'#`),
        c(";\xF4.# &;\xA0"),
        c(`%2\u0195""6\u01957\u0196/L#;</C$2\u0197""6\u01977\u0198.) &2\u0199""6\u01997\u019A/($8#:\u019B#! )(#'#("'#&'#`),
        c(`%;\x9E/^#$%;B/,#;\xA0/#$+")("'#&'#06*%;B/,#;\xA0/#$+")("'#&'#&/($8":\u019C"!!)("'#&'#`),
        c(`%;6/5#;0/,$;\xF7/#$+#)(#'#("'#&'#`),
        c("$;2.) &;4.# &;.0/*;2.) &;4.# &;.&"),
        c("$;%0#*;%&"),
        c(`%;\xFA/;#28""6879/,$;\xFB/#$+#)(#'#("'#&'#`),
        c(`%3\u019D""5%7\u019E.) &3\u019F""5$7\u01A0/' 8!:\u01A1!! )`),
        c(`%;\xFC/J#%28""6879/,#;^/#$+")("'#&'#." &"/#$+")("'#&'#`),
        c("%;\\.) &;X.# &;\x82/' 8!:\u01A2!! )"),
        c(';".S &;!.M &2F""6F7G.A &2J""6J7K.5 &2H""6H7I.) &2N""6N7O'),
        c('2L""6L7M.\x95 &2B""6B7C.\x89 &2<""6<7=.} &2R""6R7S.q &2T""6T7U.e &2V""6V7W.Y &2P""6P7Q.M &2@""6@7A.A &2D""6D7E.5 &22""6273.) &2>""6>7?'),
        c(`%;\u0100/b#28""6879/S$;\xFB/J$%2\u01A3""6\u01A37\u01A4/,#;\xEC/#$+")("'#&'#." &"/#$+$)($'#(#'#("'#&'#`),
        c(`%3\u01A5""5%7\u01A6.) &3\u01A7""5$7\u01A8/' 8!:\u01A1!! )`),
        c(`%3\xB1""5#7\xB2.6 &3\xB3""5#7\xB4.* &$;+0#*;+&/' 8!:\u01A9!! )`),
        c(`%;\u0104/\x87#2F""6F7G/x$;\u0103/o$2F""6F7G/\`$;\u0103/W$2F""6F7G/H$;\u0103/?$2F""6F7G/0$;\u0105/'$8):\u01AA) )()'#(('#(''#(&'#(%'#($'#(#'#("'#&'#`),
        c(`%;#/>#;#/5$;#/,$;#/#$+$)($'#(#'#("'#&'#`),
        c(`%;\u0103/,#;\u0103/#$+")("'#&'#`),
        c(`%;\u0103/5#;\u0103/,$;\u0103/#$+#)(#'#("'#&'#`),
        c(`%;q/T#$;m0#*;m&/D$%; /,#;\xF8/#$+")("'#&'#." &"/#$+#)(#'#("'#&'#`),
        c(`%2\u01AB""6\u01AB7\u01AC.) &2\u01AD""6\u01AD7\u01AE/w#;0/n$;\u0108/e$$%;B/2#;\u0109.# &;\xA0/#$+")("'#&'#0<*%;B/2#;\u0109.# &;\xA0/#$+")("'#&'#&/#$+$)($'#(#'#("'#&'#`),
        c(";\x99.# &;L"),
        c(`%2\u01AF""6\u01AF7\u01B0/5#;</,$;\u010A/#$+#)(#'#("'#&'#`),
        c(`%;D/S#;,/J$2:""6:7;/;$;,.# &;T/,$;E/#$+%)(%'#($'#(#'#("'#&'#`)
    ], a = 0, g = 0, w = [
        {
            line: 1,
            column: 1
        }
    ], u = 0, v = [], E = 0, H;
    if (e.startRule !== void 0) {
        if (!(e.startRule in r)) throw new Error(`Can't start parsing from rule "` + e.startRule + '".');
        s = r[e.startRule];
    }
    function S() {
        return o.substring(g, a);
    }
    function V() {
        return Re(g, a);
    }
    function p(d, f) {
        return {
            type: "literal",
            text: d,
            ignoreCase: f
        };
    }
    function _(d, f, l) {
        return {
            type: "class",
            parts: d,
            inverted: f,
            ignoreCase: l
        };
    }
    function _t() {
        return {
            type: "end"
        };
    }
    function Tt(d) {
        let f = w[d], l;
        if (f) return f;
        for(l = d - 1; !w[l];)l--;
        for(f = w[l], f = {
            line: f.line,
            column: f.column
        }; l < d;)o.charCodeAt(l) === 10 ? (f.line++, f.column = 1) : f.column++, l++;
        return w[d] = f, f;
    }
    function Re(d, f) {
        let l = Tt(d), Z = Tt(f);
        return {
            start: {
                offset: d,
                line: l.line,
                column: l.column
            },
            end: {
                offset: f,
                line: Z.line,
                column: Z.column
            }
        };
    }
    function Et(d) {
        a < u || (a > u && (u = a, v = []), v.push(d));
    }
    function bt(d, f, l) {
        return new be(be.buildMessage(d, f), d, f, l);
    }
    function c(d) {
        return d.split("").map((f)=>f.charCodeAt(0) - 32
        );
    }
    function St(d) {
        let f = n[d], l = 0, Z = [], P = f.length, se = [], $ = [], $t;
        for(;;){
            for(; l < P;)switch(f[l]){
                case 0:
                    $.push(i[f[l + 1]]), l += 2;
                    break;
                case 1:
                    $.push(void 0), l++;
                    break;
                case 2:
                    $.push(null), l++;
                    break;
                case 3:
                    $.push(t), l++;
                    break;
                case 4:
                    $.push([]), l++;
                    break;
                case 5:
                    $.push(a), l++;
                    break;
                case 6:
                    $.pop(), l++;
                    break;
                case 7:
                    a = $.pop(), l++;
                    break;
                case 8:
                    $.length -= f[l + 1], l += 2;
                    break;
                case 9:
                    $.splice(-2, 1), l++;
                    break;
                case 10:
                    $[$.length - 2].push($.pop()), l++;
                    break;
                case 11:
                    $.push($.splice($.length - f[l + 1], f[l + 1])), l += 2;
                    break;
                case 12:
                    $.push(o.substring($.pop(), a)), l++;
                    break;
                case 13:
                    se.push(P), Z.push(l + 3 + f[l + 1] + f[l + 2]), $[$.length - 1] ? (P = l + 3 + f[l + 1], l += 3) : (P = l + 3 + f[l + 1] + f[l + 2], l += 3 + f[l + 1]);
                    break;
                case 14:
                    se.push(P), Z.push(l + 3 + f[l + 1] + f[l + 2]), $[$.length - 1] === t ? (P = l + 3 + f[l + 1], l += 3) : (P = l + 3 + f[l + 1] + f[l + 2], l += 3 + f[l + 1]);
                    break;
                case 15:
                    se.push(P), Z.push(l + 3 + f[l + 1] + f[l + 2]), $[$.length - 1] !== t ? (P = l + 3 + f[l + 1], l += 3) : (P = l + 3 + f[l + 1] + f[l + 2], l += 3 + f[l + 1]);
                    break;
                case 16:
                    $[$.length - 1] !== t ? (se.push(P), Z.push(l), P = l + 2 + f[l + 1], l += 2) : l += 2 + f[l + 1];
                    break;
                case 17:
                    se.push(P), Z.push(l + 3 + f[l + 1] + f[l + 2]), o.length > a ? (P = l + 3 + f[l + 1], l += 3) : (P = l + 3 + f[l + 1] + f[l + 2], l += 3 + f[l + 1]);
                    break;
                case 18:
                    se.push(P), Z.push(l + 4 + f[l + 2] + f[l + 3]), o.substr(a, i[f[l + 1]].length) === i[f[l + 1]] ? (P = l + 4 + f[l + 2], l += 4) : (P = l + 4 + f[l + 2] + f[l + 3], l += 4 + f[l + 2]);
                    break;
                case 19:
                    se.push(P), Z.push(l + 4 + f[l + 2] + f[l + 3]), o.substr(a, i[f[l + 1]].length).toLowerCase() === i[f[l + 1]] ? (P = l + 4 + f[l + 2], l += 4) : (P = l + 4 + f[l + 2] + f[l + 3], l += 4 + f[l + 2]);
                    break;
                case 20:
                    se.push(P), Z.push(l + 4 + f[l + 2] + f[l + 3]), i[f[l + 1]].test(o.charAt(a)) ? (P = l + 4 + f[l + 2], l += 4) : (P = l + 4 + f[l + 2] + f[l + 3], l += 4 + f[l + 2]);
                    break;
                case 21:
                    $.push(o.substr(a, f[l + 1])), a += f[l + 1], l += 2;
                    break;
                case 22:
                    $.push(i[f[l + 1]]), a += i[f[l + 1]].length, l += 2;
                    break;
                case 23:
                    $.push(t), E === 0 && Et(i[f[l + 1]]), l += 2;
                    break;
                case 24:
                    g = $[$.length - 1 - f[l + 1]], l += 2;
                    break;
                case 25:
                    g = a, l++;
                    break;
                case 26:
                    $t = f.slice(l + 4, l + 4 + f[l + 3]).map(function(Ft) {
                        return $[$.length - 1 - Ft];
                    }), $.splice($.length - f[l + 2], f[l + 2], i[f[l + 1]].apply(null, $t)), l += 4 + f[l + 3];
                    break;
                case 27:
                    $.push(St(f[l + 1])), l += 2;
                    break;
                case 28:
                    E++, l++;
                    break;
                case 29:
                    E--, l++;
                    break;
                default:
                    throw new Error("Invalid opcode: " + f[l] + ".");
            }
            if (se.length > 0) P = se.pop(), l = Z.pop();
            else break;
        }
        return $[0];
    }
    e.data = {};
    function Nt(d, f) {
        return [
            d
        ].concat(f);
    }
    if (H = St(s), H !== t && a === o.length) return H;
    throw H !== t && a < o.length && Et(_t()), bt(v, u < o.length ? o.charAt(u) : null, u < o.length ? Re(u, u + 1) : Re(u, u));
}
var Rt = Mt;
var R;
(function(o) {
    function e(s, i) {
        let n = {
            startRule: i
        };
        try {
            Rt(s, n);
        } catch  {
            n.data = -1;
        }
        return n.data;
    }
    o.parse = e;
    function t(s) {
        let i = o.parse(s, "Name_Addr_Header");
        return i !== -1 ? i : void 0;
    }
    o.nameAddrHeaderParse = t;
    function r(s) {
        let i = o.parse(s, "SIP_URI");
        return i !== -1 ? i : void 0;
    }
    o.URIParse = r;
})(R || (R = {}));
var x;
(function(o) {
    o.ACK = "ACK", o.BYE = "BYE", o.CANCEL = "CANCEL", o.INFO = "INFO", o.INVITE = "INVITE", o.MESSAGE = "MESSAGE", o.NOTIFY = "NOTIFY", o.OPTIONS = "OPTIONS", o.REGISTER = "REGISTER", o.UPDATE = "UPDATE", o.SUBSCRIBE = "SUBSCRIBE", o.PUBLISH = "PUBLISH", o.REFER = "REFER", o.PRACK = "PRACK";
})(x || (x = {}));
var jt = {
    100: "Trying",
    180: "Ringing",
    181: "Call Is Being Forwarded",
    182: "Queued",
    183: "Session Progress",
    199: "Early Dialog Terminated",
    200: "OK",
    202: "Accepted",
    204: "No Notification",
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Moved Temporarily",
    305: "Use Proxy",
    380: "Alternative Service",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    410: "Gone",
    412: "Conditional Request Failed",
    413: "Request Entity Too Large",
    414: "Request-URI Too Long",
    415: "Unsupported Media Type",
    416: "Unsupported URI Scheme",
    417: "Unknown Resource-Priority",
    420: "Bad Extension",
    421: "Extension Required",
    422: "Session Interval Too Small",
    423: "Interval Too Brief",
    428: "Use Identity Header",
    429: "Provide Referrer Identity",
    430: "Flow Failed",
    433: "Anonymity Disallowed",
    436: "Bad Identity-Info",
    437: "Unsupported Certificate",
    438: "Invalid Identity Header",
    439: "First Hop Lacks Outbound Support",
    440: "Max-Breadth Exceeded",
    469: "Bad Info Package",
    470: "Consent Needed",
    478: "Unresolvable Destination",
    480: "Temporarily Unavailable",
    481: "Call/Transaction Does Not Exist",
    482: "Loop Detected",
    483: "Too Many Hops",
    484: "Address Incomplete",
    485: "Ambiguous",
    486: "Busy Here",
    487: "Request Terminated",
    488: "Not Acceptable Here",
    489: "Bad Event",
    491: "Request Pending",
    493: "Undecipherable",
    494: "Security Agreement Required",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Server Time-out",
    505: "Version Not Supported",
    513: "Message Too Large",
    580: "Precondition Failure",
    600: "Busy Everywhere",
    603: "Decline",
    604: "Does Not Exist Anywhere",
    606: "Not Acceptable"
};
function ie(o, e = 32) {
    let t = "";
    for(let r = 0; r < o; r++)t += Math.floor(Math.random() * e).toString(e);
    return t;
}
function de(o) {
    return jt[o] || "";
}
function he() {
    return ie(10);
}
function J(o) {
    let e = {
        "Call-Id": "Call-ID",
        Cseq: "CSeq",
        "Min-Se": "Min-SE",
        Rack: "RAck",
        Rseq: "RSeq",
        "Www-Authenticate": "WWW-Authenticate"
    }, t = o.toLowerCase().replace(/_/g, "-").split("-"), r = t.length, s = "";
    for(let i = 0; i < r; i++)i !== 0 && (s += "-"), s += t[i].charAt(0).toUpperCase() + t[i].substring(1);
    return e[s] && (s = e[s]), s;
}
function le(o) {
    return encodeURIComponent(o).replace(/%[A-F\d]{2}/g, "U").length;
}
var De = class {
    constructor(){
        this.headers = {};
    }
    addHeader(e, t) {
        let r = {
            raw: t
        };
        e = J(e), this.headers[e] ? this.headers[e].push(r) : this.headers[e] = [
            r
        ];
    }
    getHeader(e) {
        let t = this.headers[J(e)];
        if (t) {
            if (t[0]) return t[0].raw;
        } else return;
    }
    getHeaders(e) {
        let t = this.headers[J(e)], r = [];
        if (!t) return [];
        for (let s of t)r.push(s.raw);
        return r;
    }
    hasHeader(e) {
        return !!this.headers[J(e)];
    }
    parseHeader(e, t = 0) {
        if (e = J(e), this.headers[e]) {
            if (t >= this.headers[e].length) return;
        } else return;
        let r = this.headers[e][t], s = r.raw;
        if (r.parsed) return r.parsed;
        let i = R.parse(s, e.replace(/-/g, "_"));
        if (i === -1) {
            this.headers[e].splice(t, 1);
            return;
        } else return r.parsed = i, i;
    }
    s(e, t = 0) {
        return this.parseHeader(e, t);
    }
    setHeader(e, t) {
        this.headers[J(e)] = [
            {
                raw: t
            }
        ];
    }
    toString() {
        return this.data;
    }
};
var ee = class extends De {
    constructor(){
        super();
    }
};
var G = class extends De {
    constructor(){
        super();
    }
};
var te = class {
    constructor(e, t, r, s, i, n, a){
        this.headers = {}, this.extraHeaders = [], this.options = te.getDefaultOptions(), i && (this.options = Object.assign(Object.assign({}, this.options), i), this.options.optionTags && this.options.optionTags.length && (this.options.optionTags = this.options.optionTags.slice()), this.options.routeSet && this.options.routeSet.length && (this.options.routeSet = this.options.routeSet.slice())), n && n.length && (this.extraHeaders = n.slice()), a && (this.body = {
            body: a.content,
            contentType: a.contentType
        }), this.method = e, this.ruri = t.clone(), this.fromURI = r.clone(), this.fromTag = this.options.fromTag ? this.options.fromTag : he(), this.from = te.makeNameAddrHeader(this.fromURI, this.options.fromDisplayName, this.fromTag), this.toURI = s.clone(), this.toTag = this.options.toTag, this.to = te.makeNameAddrHeader(this.toURI, this.options.toDisplayName, this.toTag), this.callId = this.options.callId ? this.options.callId : this.options.callIdPrefix + ie(15), this.cseq = this.options.cseq, this.setHeader("route", this.options.routeSet), this.setHeader("via", ""), this.setHeader("to", this.to.toString()), this.setHeader("from", this.from.toString()), this.setHeader("cseq", this.cseq + " " + this.method), this.setHeader("call-id", this.callId), this.setHeader("max-forwards", "70");
    }
    static getDefaultOptions() {
        return {
            callId: "",
            callIdPrefix: "",
            cseq: 1,
            toDisplayName: "",
            toTag: "",
            fromDisplayName: "",
            fromTag: "",
            forceRport: !1,
            hackViaTcp: !1,
            optionTags: [
                "outbound"
            ],
            routeSet: [],
            userAgentString: "sip.js",
            viaHost: ""
        };
    }
    static makeNameAddrHeader(e, t, r) {
        let s = {};
        return r && (s.tag = r), new N(e, t, s);
    }
    getHeader(e) {
        let t = this.headers[J(e)];
        if (t) {
            if (t[0]) return t[0];
        } else {
            let r = new RegExp("^\\s*" + e + "\\s*:", "i");
            for (let s of this.extraHeaders)if (r.test(s)) return s.substring(s.indexOf(":") + 1).trim();
        }
    }
    getHeaders(e) {
        let t = [], r = this.headers[J(e)];
        if (r) for (let s of r)t.push(s);
        else {
            let s = new RegExp("^\\s*" + e + "\\s*:", "i");
            for (let i of this.extraHeaders)s.test(i) && t.push(i.substring(i.indexOf(":") + 1).trim());
        }
        return t;
    }
    hasHeader(e) {
        if (this.headers[J(e)]) return !0;
        {
            let t = new RegExp("^\\s*" + e + "\\s*:", "i");
            for (let r of this.extraHeaders)if (t.test(r)) return !0;
        }
        return !1;
    }
    setHeader(e, t) {
        this.headers[J(e)] = t instanceof Array ? t : [
            t
        ];
    }
    setViaHeader(e, t) {
        this.options.hackViaTcp && (t = "TCP");
        let r = "SIP/2.0/" + t;
        r += " " + this.options.viaHost + ";branch=" + e, this.options.forceRport && (r += ";rport"), this.setHeader("via", r), this.branch = e;
    }
    toString() {
        let e = "";
        e += this.method + " " + this.ruri.toRaw() + ` SIP/2.0\r
`;
        for(let t in this.headers)if (this.headers[t]) for (let r of this.headers[t])e += t + ": " + r + `\r
`;
        for (let t1 of this.extraHeaders)e += t1.trim() + `\r
`;
        return e += "Supported: " + this.options.optionTags.join(", ") + `\r
`, e += "User-Agent: " + this.options.userAgentString + `\r
`, this.body ? typeof this.body == "string" ? (e += "Content-Length: " + le(this.body) + `\r
\r
`, e += this.body) : this.body.body && this.body.contentType ? (e += "Content-Type: " + this.body.contentType + `\r
`, e += "Content-Length: " + le(this.body.body) + `\r
\r
`, e += this.body.body) : e += "Content-Length: " + 0 + `\r
\r
` : e += "Content-Length: " + 0 + `\r
\r
`, e;
    }
};
function At(o) {
    return o === "application/sdp" ? "session" : "render";
}
function Se(o) {
    let e = typeof o == "string" ? o : o.body, t = typeof o == "string" ? "application/sdp" : o.contentType;
    return {
        contentDisposition: At(t),
        contentType: t,
        content: e
    };
}
function Ke(o) {
    return o && typeof o.content == "string" && typeof o.contentType == "string" && o.contentDisposition === void 0 ? !0 : typeof o.contentDisposition == "string";
}
function ue(o) {
    let e, t, r;
    if (o instanceof ee && o.body) {
        let s = o.parseHeader("Content-Disposition");
        e = s ? s.type : void 0, t = o.parseHeader("Content-Type"), r = o.body;
    }
    if (o instanceof G && o.body) {
        let s = o.parseHeader("Content-Disposition");
        e = s ? s.type : void 0, t = o.parseHeader("Content-Type"), r = o.body;
    }
    if (o instanceof te && o.body) if (e = o.getHeader("Content-Disposition"), t = o.getHeader("Content-Type"), typeof o.body == "string") {
        if (!t) throw new Error("Header content type header does not equal body content type.");
        r = o.body;
    } else {
        if (t && t !== o.body.contentType) throw new Error("Header content type header does not equal body content type.");
        t = o.body.contentType, r = o.body.body;
    }
    if (Ke(o) && (e = o.contentDisposition, t = o.contentType, r = o.content), !!r) {
        if (t && !e && (e = At(t)), !e) throw new Error("Content disposition undefined.");
        if (!t) throw new Error("Content type undefined.");
        return {
            contentDisposition: e,
            contentType: t,
            content: r
        };
    }
}
var q = class {
    constructor(){
        this._dataLength = 0, this._bufferLength = 0, this._state = new Int32Array(4), this._buffer = new ArrayBuffer(68), this._buffer8 = new Uint8Array(this._buffer, 0, 68), this._buffer32 = new Uint32Array(this._buffer, 0, 17), this.start();
    }
    static hashStr(e, t = !1) {
        return this.onePassHasher.start().appendStr(e).end(t);
    }
    static hashAsciiStr(e, t = !1) {
        return this.onePassHasher.start().appendAsciiStr(e).end(t);
    }
    static _hex(e) {
        let t = q.hexChars, r = q.hexOut, s, i, n, a;
        for(a = 0; a < 4; a += 1)for(i = a * 8, s = e[a], n = 0; n < 8; n += 2)r[i + 1 + n] = t.charAt(s & 15), s >>>= 4, r[i + 0 + n] = t.charAt(s & 15), s >>>= 4;
        return r.join("");
    }
    static _md5cycle(e, t) {
        let r = e[0], s = e[1], i = e[2], n = e[3];
        r += (s & i | ~s & n) + t[0] - 680876936 | 0, r = (r << 7 | r >>> 25) + s | 0, n += (r & s | ~r & i) + t[1] - 389564586 | 0, n = (n << 12 | n >>> 20) + r | 0, i += (n & r | ~n & s) + t[2] + 606105819 | 0, i = (i << 17 | i >>> 15) + n | 0, s += (i & n | ~i & r) + t[3] - 1044525330 | 0, s = (s << 22 | s >>> 10) + i | 0, r += (s & i | ~s & n) + t[4] - 176418897 | 0, r = (r << 7 | r >>> 25) + s | 0, n += (r & s | ~r & i) + t[5] + 1200080426 | 0, n = (n << 12 | n >>> 20) + r | 0, i += (n & r | ~n & s) + t[6] - 1473231341 | 0, i = (i << 17 | i >>> 15) + n | 0, s += (i & n | ~i & r) + t[7] - 45705983 | 0, s = (s << 22 | s >>> 10) + i | 0, r += (s & i | ~s & n) + t[8] + 1770035416 | 0, r = (r << 7 | r >>> 25) + s | 0, n += (r & s | ~r & i) + t[9] - 1958414417 | 0, n = (n << 12 | n >>> 20) + r | 0, i += (n & r | ~n & s) + t[10] - 42063 | 0, i = (i << 17 | i >>> 15) + n | 0, s += (i & n | ~i & r) + t[11] - 1990404162 | 0, s = (s << 22 | s >>> 10) + i | 0, r += (s & i | ~s & n) + t[12] + 1804603682 | 0, r = (r << 7 | r >>> 25) + s | 0, n += (r & s | ~r & i) + t[13] - 40341101 | 0, n = (n << 12 | n >>> 20) + r | 0, i += (n & r | ~n & s) + t[14] - 1502002290 | 0, i = (i << 17 | i >>> 15) + n | 0, s += (i & n | ~i & r) + t[15] + 1236535329 | 0, s = (s << 22 | s >>> 10) + i | 0, r += (s & n | i & ~n) + t[1] - 165796510 | 0, r = (r << 5 | r >>> 27) + s | 0, n += (r & i | s & ~i) + t[6] - 1069501632 | 0, n = (n << 9 | n >>> 23) + r | 0, i += (n & s | r & ~s) + t[11] + 643717713 | 0, i = (i << 14 | i >>> 18) + n | 0, s += (i & r | n & ~r) + t[0] - 373897302 | 0, s = (s << 20 | s >>> 12) + i | 0, r += (s & n | i & ~n) + t[5] - 701558691 | 0, r = (r << 5 | r >>> 27) + s | 0, n += (r & i | s & ~i) + t[10] + 38016083 | 0, n = (n << 9 | n >>> 23) + r | 0, i += (n & s | r & ~s) + t[15] - 660478335 | 0, i = (i << 14 | i >>> 18) + n | 0, s += (i & r | n & ~r) + t[4] - 405537848 | 0, s = (s << 20 | s >>> 12) + i | 0, r += (s & n | i & ~n) + t[9] + 568446438 | 0, r = (r << 5 | r >>> 27) + s | 0, n += (r & i | s & ~i) + t[14] - 1019803690 | 0, n = (n << 9 | n >>> 23) + r | 0, i += (n & s | r & ~s) + t[3] - 187363961 | 0, i = (i << 14 | i >>> 18) + n | 0, s += (i & r | n & ~r) + t[8] + 1163531501 | 0, s = (s << 20 | s >>> 12) + i | 0, r += (s & n | i & ~n) + t[13] - 1444681467 | 0, r = (r << 5 | r >>> 27) + s | 0, n += (r & i | s & ~i) + t[2] - 51403784 | 0, n = (n << 9 | n >>> 23) + r | 0, i += (n & s | r & ~s) + t[7] + 1735328473 | 0, i = (i << 14 | i >>> 18) + n | 0, s += (i & r | n & ~r) + t[12] - 1926607734 | 0, s = (s << 20 | s >>> 12) + i | 0, r += (s ^ i ^ n) + t[5] - 378558 | 0, r = (r << 4 | r >>> 28) + s | 0, n += (r ^ s ^ i) + t[8] - 2022574463 | 0, n = (n << 11 | n >>> 21) + r | 0, i += (n ^ r ^ s) + t[11] + 1839030562 | 0, i = (i << 16 | i >>> 16) + n | 0, s += (i ^ n ^ r) + t[14] - 35309556 | 0, s = (s << 23 | s >>> 9) + i | 0, r += (s ^ i ^ n) + t[1] - 1530992060 | 0, r = (r << 4 | r >>> 28) + s | 0, n += (r ^ s ^ i) + t[4] + 1272893353 | 0, n = (n << 11 | n >>> 21) + r | 0, i += (n ^ r ^ s) + t[7] - 155497632 | 0, i = (i << 16 | i >>> 16) + n | 0, s += (i ^ n ^ r) + t[10] - 1094730640 | 0, s = (s << 23 | s >>> 9) + i | 0, r += (s ^ i ^ n) + t[13] + 681279174 | 0, r = (r << 4 | r >>> 28) + s | 0, n += (r ^ s ^ i) + t[0] - 358537222 | 0, n = (n << 11 | n >>> 21) + r | 0, i += (n ^ r ^ s) + t[3] - 722521979 | 0, i = (i << 16 | i >>> 16) + n | 0, s += (i ^ n ^ r) + t[6] + 76029189 | 0, s = (s << 23 | s >>> 9) + i | 0, r += (s ^ i ^ n) + t[9] - 640364487 | 0, r = (r << 4 | r >>> 28) + s | 0, n += (r ^ s ^ i) + t[12] - 421815835 | 0, n = (n << 11 | n >>> 21) + r | 0, i += (n ^ r ^ s) + t[15] + 530742520 | 0, i = (i << 16 | i >>> 16) + n | 0, s += (i ^ n ^ r) + t[2] - 995338651 | 0, s = (s << 23 | s >>> 9) + i | 0, r += (i ^ (s | ~n)) + t[0] - 198630844 | 0, r = (r << 6 | r >>> 26) + s | 0, n += (s ^ (r | ~i)) + t[7] + 1126891415 | 0, n = (n << 10 | n >>> 22) + r | 0, i += (r ^ (n | ~s)) + t[14] - 1416354905 | 0, i = (i << 15 | i >>> 17) + n | 0, s += (n ^ (i | ~r)) + t[5] - 57434055 | 0, s = (s << 21 | s >>> 11) + i | 0, r += (i ^ (s | ~n)) + t[12] + 1700485571 | 0, r = (r << 6 | r >>> 26) + s | 0, n += (s ^ (r | ~i)) + t[3] - 1894986606 | 0, n = (n << 10 | n >>> 22) + r | 0, i += (r ^ (n | ~s)) + t[10] - 1051523 | 0, i = (i << 15 | i >>> 17) + n | 0, s += (n ^ (i | ~r)) + t[1] - 2054922799 | 0, s = (s << 21 | s >>> 11) + i | 0, r += (i ^ (s | ~n)) + t[8] + 1873313359 | 0, r = (r << 6 | r >>> 26) + s | 0, n += (s ^ (r | ~i)) + t[15] - 30611744 | 0, n = (n << 10 | n >>> 22) + r | 0, i += (r ^ (n | ~s)) + t[6] - 1560198380 | 0, i = (i << 15 | i >>> 17) + n | 0, s += (n ^ (i | ~r)) + t[13] + 1309151649 | 0, s = (s << 21 | s >>> 11) + i | 0, r += (i ^ (s | ~n)) + t[4] - 145523070 | 0, r = (r << 6 | r >>> 26) + s | 0, n += (s ^ (r | ~i)) + t[11] - 1120210379 | 0, n = (n << 10 | n >>> 22) + r | 0, i += (r ^ (n | ~s)) + t[2] + 718787259 | 0, i = (i << 15 | i >>> 17) + n | 0, s += (n ^ (i | ~r)) + t[9] - 343485551 | 0, s = (s << 21 | s >>> 11) + i | 0, e[0] = r + e[0] | 0, e[1] = s + e[1] | 0, e[2] = i + e[2] | 0, e[3] = n + e[3] | 0;
    }
    start() {
        return this._dataLength = 0, this._bufferLength = 0, this._state.set(q.stateIdentity), this;
    }
    appendStr(e) {
        let t = this._buffer8, r = this._buffer32, s = this._bufferLength, i, n;
        for(n = 0; n < e.length; n += 1){
            if (i = e.charCodeAt(n), i < 128) t[s++] = i;
            else if (i < 2048) t[s++] = (i >>> 6) + 192, t[s++] = i & 63 | 128;
            else if (i < 55296 || i > 56319) t[s++] = (i >>> 12) + 224, t[s++] = i >>> 6 & 63 | 128, t[s++] = i & 63 | 128;
            else {
                if (i = (i - 55296) * 1024 + (e.charCodeAt(++n) - 56320) + 65536, i > 1114111) throw new Error("Unicode standard supports code points up to U+10FFFF");
                t[s++] = (i >>> 18) + 240, t[s++] = i >>> 12 & 63 | 128, t[s++] = i >>> 6 & 63 | 128, t[s++] = i & 63 | 128;
            }
            s >= 64 && (this._dataLength += 64, q._md5cycle(this._state, r), s -= 64, r[0] = r[16]);
        }
        return this._bufferLength = s, this;
    }
    appendAsciiStr(e) {
        let t = this._buffer8, r = this._buffer32, s = this._bufferLength, i, n = 0;
        for(;;){
            for(i = Math.min(e.length - n, 64 - s); i--;)t[s++] = e.charCodeAt(n++);
            if (s < 64) break;
            this._dataLength += 64, q._md5cycle(this._state, r), s = 0;
        }
        return this._bufferLength = s, this;
    }
    appendByteArray(e) {
        let t = this._buffer8, r = this._buffer32, s = this._bufferLength, i, n = 0;
        for(;;){
            for(i = Math.min(e.length - n, 64 - s); i--;)t[s++] = e[n++];
            if (s < 64) break;
            this._dataLength += 64, q._md5cycle(this._state, r), s = 0;
        }
        return this._bufferLength = s, this;
    }
    getState() {
        let e = this, t = e._state;
        return {
            buffer: String.fromCharCode.apply(null, e._buffer8),
            buflen: e._bufferLength,
            length: e._dataLength,
            state: [
                t[0],
                t[1],
                t[2],
                t[3]
            ]
        };
    }
    setState(e) {
        let t = e.buffer, r = e.state, s = this._state, i;
        for(this._dataLength = e.length, this._bufferLength = e.buflen, s[0] = r[0], s[1] = r[1], s[2] = r[2], s[3] = r[3], i = 0; i < t.length; i += 1)this._buffer8[i] = t.charCodeAt(i);
    }
    end(e = !1) {
        let t = this._bufferLength, r = this._buffer8, s = this._buffer32, i = (t >> 2) + 1, n;
        if (this._dataLength += t, r[t] = 128, r[t + 1] = r[t + 2] = r[t + 3] = 0, s.set(q.buffer32Identity.subarray(i), i), t > 55 && (q._md5cycle(this._state, s), s.set(q.buffer32Identity)), n = this._dataLength * 8, n <= 4294967295) s[14] = n;
        else {
            let a = n.toString(16).match(/(.*?)(.{0,8})$/);
            if (a === null) return;
            let g = parseInt(a[2], 16), w = parseInt(a[1], 16) || 0;
            s[14] = g, s[15] = w;
        }
        return q._md5cycle(this._state, s), e ? this._state : q._hex(this._state);
    }
};
q.stateIdentity = new Int32Array([
    1732584193,
    -271733879,
    -1732584194,
    271733878
]);
q.buffer32Identity = new Int32Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
]);
q.hexChars = "0123456789abcdef";
q.hexOut = [];
q.onePassHasher = new q;
q.hashStr("hello") !== "5d41402abc4b2a76b9719d911017c592" && console.error("Md5 self test failed.");
function ge(o) {
    return q.hashStr(o);
}
var We = class {
    constructor(e, t, r, s){
        this.logger = e.getLogger("sipjs.digestauthentication"), this.username = r, this.password = s, this.ha1 = t, this.nc = 0, this.ncHex = "00000000";
    }
    authenticate(e, t, r) {
        if (this.algorithm = t.algorithm, this.realm = t.realm, this.nonce = t.nonce, this.opaque = t.opaque, this.stale = t.stale, this.algorithm) {
            if (this.algorithm !== "MD5") return this.logger.warn("challenge with Digest algorithm different than 'MD5', authentication aborted"), !1;
        } else this.algorithm = "MD5";
        if (!this.realm) return this.logger.warn("challenge without Digest realm, authentication aborted"), !1;
        if (!this.nonce) return this.logger.warn("challenge without Digest nonce, authentication aborted"), !1;
        if (t.qop) if (t.qop.indexOf("auth") > -1) this.qop = "auth";
        else if (t.qop.indexOf("auth-int") > -1) this.qop = "auth-int";
        else return this.logger.warn("challenge without Digest qop different than 'auth' or 'auth-int', authentication aborted"), !1;
        else this.qop = void 0;
        return this.method = e.method, this.uri = e.ruri, this.cnonce = ie(12), this.nc += 1, this.updateNcHex(), this.nc === 4294967296 && (this.nc = 1, this.ncHex = "00000001"), this.calculateResponse(r), !0;
    }
    toString() {
        let e = [];
        if (!this.response) throw new Error("response field does not exist, cannot generate Authorization header");
        return e.push("algorithm=" + this.algorithm), e.push('username="' + this.username + '"'), e.push('realm="' + this.realm + '"'), e.push('nonce="' + this.nonce + '"'), e.push('uri="' + this.uri + '"'), e.push('response="' + this.response + '"'), this.opaque && e.push('opaque="' + this.opaque + '"'), this.qop && (e.push("qop=" + this.qop), e.push('cnonce="' + this.cnonce + '"'), e.push("nc=" + this.ncHex)), "Digest " + e.join(", ");
    }
    updateNcHex() {
        let e = Number(this.nc).toString(16);
        this.ncHex = "00000000".substr(0, 8 - e.length) + e;
    }
    calculateResponse(e) {
        let t, r;
        t = this.ha1, (t === "" || t === void 0) && (t = ge(this.username + ":" + this.realm + ":" + this.password)), this.qop === "auth" ? (r = ge(this.method + ":" + this.uri), this.response = ge(t + ":" + this.nonce + ":" + this.ncHex + ":" + this.cnonce + ":auth:" + r)) : this.qop === "auth-int" ? (r = ge(this.method + ":" + this.uri + ":" + ge(e || "")), this.response = ge(t + ":" + this.nonce + ":" + this.ncHex + ":" + this.cnonce + ":auth-int:" + r)) : this.qop === void 0 && (r = ge(this.method + ":" + this.uri), this.response = ge(t + ":" + this.nonce + ":" + r));
    }
};
function Ue(o, e) {
    let t = `\r
`;
    if (e.statusCode < 100 || e.statusCode > 699) throw new TypeError("Invalid statusCode: " + e.statusCode);
    let r = e.reasonPhrase ? e.reasonPhrase : de(e.statusCode), s = "SIP/2.0 " + e.statusCode + " " + r + t;
    e.statusCode >= 100 && e.statusCode < 200, e.statusCode === 100;
    let i = "From: " + o.getHeader("From") + t, n = "Call-ID: " + o.callId + t, a = "CSeq: " + o.cseq + " " + o.method + t, g = o.getHeaders("via").reduce((H, S)=>H + "Via: " + S + t
    , ""), w = "To: " + o.getHeader("to");
    if (e.statusCode > 100 && !o.parseHeader("to").hasParam("tag")) {
        let H = e.toTag;
        H || (H = he()), w += ";tag=" + H;
    }
    w += t;
    let u = "";
    e.supported && (u = "Supported: " + e.supported.join(", ") + t);
    let v = "";
    e.userAgent && (v = "User-Agent: " + e.userAgent + t);
    let E = "";
    return e.extraHeaders && (E = e.extraHeaders.reduce((H, S)=>H + S.trim() + t
    , "")), s += g, s += i, s += w, s += a, s += n, s += u, s += v, s += E, e.body ? (s += "Content-Type: " + e.body.contentType + t, s += "Content-Length: " + le(e.body.content) + t + t, s += e.body.content) : s += "Content-Length: " + 0 + t + t, {
        message: s
    };
}
var je;
(function(o) {
    function e(s, i) {
        let n = i, a = 0, g = 0;
        if (s.substring(n, n + 2).match(/(^\r\n)/)) return -2;
        for(; a === 0;){
            if (g = s.indexOf(`\r
`, n), g === -1) return g;
            !s.substring(g + 2, g + 4).match(/(^\r\n)/) && s.charAt(g + 2).match(/(^\s+)/) ? n = g + 2 : a = g;
        }
        return a;
    }
    o.getHeader = e;
    function t(s, i, n, a) {
        let g = i.indexOf(":", n), w = i.substring(n, g).trim(), u = i.substring(g + 1, a).trim(), v;
        switch(w.toLowerCase()){
            case "via":
            case "v":
                s.addHeader("via", u), s.getHeaders("via").length === 1 ? (v = s.parseHeader("Via"), v && (s.via = v, s.viaBranch = v.branch)) : v = 0;
                break;
            case "from":
            case "f":
                s.setHeader("from", u), v = s.parseHeader("from"), v && (s.from = v, s.fromTag = v.getParam("tag"));
                break;
            case "to":
            case "t":
                s.setHeader("to", u), v = s.parseHeader("to"), v && (s.to = v, s.toTag = v.getParam("tag"));
                break;
            case "record-route":
                if (v = R.parse(u, "Record_Route"), v === -1) {
                    v = void 0;
                    break;
                }
                if (!(v instanceof Array)) {
                    v = void 0;
                    break;
                }
                v.forEach((E)=>{
                    s.addHeader("record-route", u.substring(E.position, E.offset)), s.headers["Record-Route"][s.getHeaders("record-route").length - 1].parsed = E.parsed;
                });
                break;
            case "call-id":
            case "i":
                s.setHeader("call-id", u), v = s.parseHeader("call-id"), v && (s.callId = u);
                break;
            case "contact":
            case "m":
                if (v = R.parse(u, "Contact"), v === -1) {
                    v = void 0;
                    break;
                }
                if (!(v instanceof Array)) {
                    v = void 0;
                    break;
                }
                v.forEach((E)=>{
                    s.addHeader("contact", u.substring(E.position, E.offset)), s.headers.Contact[s.getHeaders("contact").length - 1].parsed = E.parsed;
                });
                break;
            case "content-length":
            case "l":
                s.setHeader("content-length", u), v = s.parseHeader("content-length");
                break;
            case "content-type":
            case "c":
                s.setHeader("content-type", u), v = s.parseHeader("content-type");
                break;
            case "cseq":
                s.setHeader("cseq", u), v = s.parseHeader("cseq"), v && (s.cseq = v.value), s instanceof G && (s.method = v.method);
                break;
            case "max-forwards":
                s.setHeader("max-forwards", u), v = s.parseHeader("max-forwards");
                break;
            case "www-authenticate":
                s.setHeader("www-authenticate", u), v = s.parseHeader("www-authenticate");
                break;
            case "proxy-authenticate":
                s.setHeader("proxy-authenticate", u), v = s.parseHeader("proxy-authenticate");
                break;
            case "refer-to":
            case "r":
                s.setHeader("refer-to", u), v = s.parseHeader("refer-to"), v && (s.referTo = v);
                break;
            default:
                s.addHeader(w.toLowerCase(), u), v = 0;
        }
        return v === void 0 ? {
            error: "error parsing header '" + w + "'"
        } : !0;
    }
    o.parseHeader = t;
    function r(s, i) {
        let n = 0, a = s.indexOf(`\r
`);
        if (a === -1) {
            i.warn("no CRLF found, not a SIP message, discarded");
            return;
        }
        let g = s.substring(0, a), w = R.parse(g, "Request_Response"), u;
        if (w === -1) {
            i.warn('error parsing first line of SIP message: "' + g + '"');
            return;
        } else w.status_code ? (u = new G, u.statusCode = w.status_code, u.reasonPhrase = w.reason_phrase) : (u = new ee, u.method = w.method, u.ruri = w.uri);
        u.data = s, n = a + 2;
        let v;
        for(;;){
            if (a = e(s, n), a === -2) {
                v = n + 2;
                break;
            } else if (a === -1) {
                i.error("malformed message");
                return;
            }
            let E = t(u, s, n, a);
            if (E && E !== !0) {
                i.error(E.error);
                return;
            }
            n = a + 2;
        }
        return u.hasHeader("content-length") ? u.body = s.substr(v, Number(u.getHeader("content-length"))) : u.body = s.substring(v), u;
    }
    o.parseMessage = r;
})(je || (je = {}));
var re = class {
    constructor(e, t){
        this.core = e, this.dialogState = t, this.core.dialogs.set(this.id, this);
    }
    static initialDialogStateForUserAgentClient(e, t) {
        let r = !1, s = t.getHeaders("record-route").reverse(), i = t.parseHeader("contact");
        if (!i) throw new Error("Contact undefined.");
        if (!(i instanceof N)) throw new Error("Contact not instance of NameAddrHeader.");
        let n = i.uri, a = e.cseq, g = void 0, w = e.callId, u = e.fromTag, v = t.toTag;
        if (!w) throw new Error("Call id undefined.");
        if (!u) throw new Error("From tag undefined.");
        if (!v) throw new Error("To tag undefined.");
        if (!e.from) throw new Error("From undefined.");
        if (!e.to) throw new Error("To undefined.");
        let E = e.from.uri, H = e.to.uri;
        if (!t.statusCode) throw new Error("Incoming response status code undefined.");
        let S = t.statusCode < 200;
        return {
            id: w + u + v,
            early: S,
            callId: w,
            localTag: u,
            remoteTag: v,
            localSequenceNumber: a,
            remoteSequenceNumber: g,
            localURI: E,
            remoteURI: H,
            remoteTarget: n,
            routeSet: s,
            secure: r
        };
    }
    static initialDialogStateForUserAgentServer(e, t, r = !1) {
        let s = !1, i = e.getHeaders("record-route"), n = e.parseHeader("contact");
        if (!n) throw new Error("Contact undefined.");
        if (!(n instanceof N)) throw new Error("Contact not instance of NameAddrHeader.");
        let a = n.uri, g = e.cseq, w = void 0, u = e.callId, v = t, E = e.fromTag, H = e.from.uri, S = e.to.uri;
        return {
            id: u + v + E,
            early: r,
            callId: u,
            localTag: v,
            remoteTag: E,
            localSequenceNumber: w,
            remoteSequenceNumber: g,
            localURI: S,
            remoteURI: H,
            remoteTarget: a,
            routeSet: i,
            secure: s
        };
    }
    dispose() {
        this.core.dialogs.delete(this.id);
    }
    get id() {
        return this.dialogState.id;
    }
    get early() {
        return this.dialogState.early;
    }
    get callId() {
        return this.dialogState.callId;
    }
    get localTag() {
        return this.dialogState.localTag;
    }
    get remoteTag() {
        return this.dialogState.remoteTag;
    }
    get localSequenceNumber() {
        return this.dialogState.localSequenceNumber;
    }
    get remoteSequenceNumber() {
        return this.dialogState.remoteSequenceNumber;
    }
    get localURI() {
        return this.dialogState.localURI;
    }
    get remoteURI() {
        return this.dialogState.remoteURI;
    }
    get remoteTarget() {
        return this.dialogState.remoteTarget;
    }
    get routeSet() {
        return this.dialogState.routeSet;
    }
    get secure() {
        return this.dialogState.secure;
    }
    get userAgentCore() {
        return this.core;
    }
    confirm() {
        this.dialogState.early = !1;
    }
    receiveRequest(e) {
        if (e.method !== x.ACK) {
            if (this.remoteSequenceNumber) {
                if (e.cseq <= this.remoteSequenceNumber) throw new Error("Out of sequence in dialog request. Did you forget to call sequenceGuard()?");
                this.dialogState.remoteSequenceNumber = e.cseq;
            }
            this.remoteSequenceNumber || (this.dialogState.remoteSequenceNumber = e.cseq);
        }
    }
    recomputeRouteSet(e) {
        this.dialogState.routeSet = e.getHeaders("record-route").reverse();
    }
    createOutgoingRequestMessage(e, t) {
        let r = this.remoteURI, s = this.remoteTag, i = this.localURI, n = this.localTag, a = this.callId, g;
        t && t.cseq ? g = t.cseq : this.dialogState.localSequenceNumber ? g = this.dialogState.localSequenceNumber += 1 : g = this.dialogState.localSequenceNumber = 1;
        let w = this.remoteTarget, u = this.routeSet, v = t && t.extraHeaders, E = t && t.body;
        return this.userAgentCore.makeOutgoingRequestMessage(e, w, i, r, {
            callId: a,
            cseq: g,
            fromTag: n,
            toTag: s,
            routeSet: u
        }, v, E);
    }
    incrementLocalSequenceNumber() {
        if (!this.dialogState.localSequenceNumber) throw new Error("Local sequence number undefined.");
        this.dialogState.localSequenceNumber += 1;
    }
    sequenceGuard(e) {
        return e.method === x.ACK ? !0 : this.remoteSequenceNumber && e.cseq <= this.remoteSequenceNumber ? (this.core.replyStateless(e, {
            statusCode: 500
        }), !1) : !0;
    }
};
var K;
(function(o) {
    o.Initial = "Initial", o.Early = "Early", o.AckWait = "AckWait", o.Confirmed = "Confirmed", o.Terminated = "Terminated";
})(K || (K = {}));
var T;
(function(o) {
    o.Initial = "Initial", o.HaveLocalOffer = "HaveLocalOffer", o.HaveRemoteOffer = "HaveRemoteOffer", o.Stable = "Stable", o.Closed = "Closed";
})(T || (T = {}));
var oe = 500, Bt = 4000, Ye = 5000, A = {
    T1: oe,
    T2: Bt,
    T4: Ye,
    TIMER_B: 64 * oe,
    TIMER_D: 0 * oe,
    TIMER_F: 64 * oe,
    TIMER_H: 64 * oe,
    TIMER_I: 0 * Ye,
    TIMER_J: 0 * oe,
    TIMER_K: 0 * Ye,
    TIMER_L: 64 * oe,
    TIMER_M: 64 * oe,
    TIMER_N: 64 * oe,
    PROVISIONAL_RESPONSE_INTERVAL: 60000
};
var L = class extends Error {
    constructor(e){
        super(e);
        Object.setPrototypeOf(this, new.target.prototype);
    }
};
var z = class extends L {
    constructor(e){
        super(e || "Transaction state error.");
    }
};
var He = class extends L {
    constructor(e){
        super(e || "Unspecified transport error.");
    }
};
var Pe = class {
    constructor(e, t, r, s, i){
        this._transport = e, this._user = t, this._id = r, this._state = s, this.listeners = new Array, this.logger = t.loggerFactory.getLogger(i, r), this.logger.debug(`Constructing ${this.typeToString()} with id ${this.id}.`);
    }
    dispose() {
        this.logger.debug(`Destroyed ${this.typeToString()} with id ${this.id}.`);
    }
    get id() {
        return this._id;
    }
    get kind() {
        throw new Error("Invalid kind.");
    }
    get state() {
        return this._state;
    }
    get transport() {
        return this._transport;
    }
    addStateChangeListener(e, t) {
        let r = ()=>{
            this.removeStateChangeListener(r), e();
        };
        (t == null ? void 0 : t.once) === !0 ? this.listeners.push(r) : this.listeners.push(e);
    }
    notifyStateChangeListeners() {
        this.listeners.slice().forEach((e)=>e()
        );
    }
    removeStateChangeListener(e) {
        this.listeners = this.listeners.filter((t)=>t !== e
        );
    }
    logTransportError(e, t) {
        this.logger.error(e.message), this.logger.error(`Transport error occurred in ${this.typeToString()} with id ${this.id}.`), this.logger.error(t);
    }
    send(e) {
        return this.transport.send(e).catch((t)=>{
            if (t instanceof He) throw this.onTransportError(t), t;
            let r;
            throw t && typeof t.message == "string" ? r = new He(t.message) : r = new He, this.onTransportError(r), r;
        });
    }
    setState(e) {
        this.logger.debug(`State change to "${e}" on ${this.typeToString()} with id ${this.id}.`), this._state = e, this._user.onStateChange && this._user.onStateChange(e), this.notifyStateChangeListeners();
    }
    typeToString() {
        return "UnknownType";
    }
};
var ve = class extends Pe {
    constructor(e, t, r, s, i){
        super(t, r, ve.makeId(e), s, i);
        this._request = e, this.user = r, e.setViaHeader(this.id, t.protocol);
    }
    static makeId(e) {
        if (e.method === "CANCEL") {
            if (!e.branch) throw new Error("Outgoing CANCEL request without a branch.");
            return e.branch;
        } else return "z9hG4bK" + Math.floor(Math.random() * 10000000);
    }
    get request() {
        return this._request;
    }
    onRequestTimeout() {
        this.user.onRequestTimeout && this.user.onRequestTimeout();
    }
};
var h;
(function(o) {
    o.Accepted = "Accepted", o.Calling = "Calling", o.Completed = "Completed", o.Confirmed = "Confirmed", o.Proceeding = "Proceeding", o.Terminated = "Terminated", o.Trying = "Trying";
})(h || (h = {}));
var X = class extends ve {
    constructor(e, t, r){
        super(e, t, r, h.Calling, "sip.transaction.ict");
        this.ackRetransmissionCache = new Map, this.B = setTimeout(()=>this.timerB()
        , A.TIMER_B), this.send(e.toString()).catch((s)=>{
            this.logTransportError(s, "Failed to send initial outgoing request.");
        });
    }
    dispose() {
        this.B && (clearTimeout(this.B), this.B = void 0), this.D && (clearTimeout(this.D), this.D = void 0), this.M && (clearTimeout(this.M), this.M = void 0), super.dispose();
    }
    get kind() {
        return "ict";
    }
    ackResponse(e) {
        let t = e.toTag;
        if (!t) throw new Error("To tag undefined.");
        let r = "z9hG4bK" + Math.floor(Math.random() * 10000000);
        e.setViaHeader(r, this.transport.protocol), this.ackRetransmissionCache.set(t, e), this.send(e.toString()).catch((s)=>{
            this.logTransportError(s, "Failed to send ACK to 2xx response.");
        });
    }
    receiveResponse(e) {
        let t = e.statusCode;
        if (!t || t < 100 || t > 699) throw new Error(`Invalid status code ${t}`);
        switch(this.state){
            case h.Calling:
                if (t >= 100 && t <= 199) {
                    this.stateTransition(h.Proceeding), this.user.receiveResponse && this.user.receiveResponse(e);
                    return;
                }
                if (t >= 200 && t <= 299) {
                    this.ackRetransmissionCache.set(e.toTag, void 0), this.stateTransition(h.Accepted), this.user.receiveResponse && this.user.receiveResponse(e);
                    return;
                }
                if (t >= 300 && t <= 699) {
                    this.stateTransition(h.Completed), this.ack(e), this.user.receiveResponse && this.user.receiveResponse(e);
                    return;
                }
                break;
            case h.Proceeding:
                if (t >= 100 && t <= 199) {
                    this.user.receiveResponse && this.user.receiveResponse(e);
                    return;
                }
                if (t >= 200 && t <= 299) {
                    this.ackRetransmissionCache.set(e.toTag, void 0), this.stateTransition(h.Accepted), this.user.receiveResponse && this.user.receiveResponse(e);
                    return;
                }
                if (t >= 300 && t <= 699) {
                    this.stateTransition(h.Completed), this.ack(e), this.user.receiveResponse && this.user.receiveResponse(e);
                    return;
                }
                break;
            case h.Accepted:
                if (t >= 200 && t <= 299) {
                    if (!this.ackRetransmissionCache.has(e.toTag)) {
                        this.ackRetransmissionCache.set(e.toTag, void 0), this.user.receiveResponse && this.user.receiveResponse(e);
                        return;
                    }
                    let s = this.ackRetransmissionCache.get(e.toTag);
                    if (s) {
                        this.send(s.toString()).catch((i)=>{
                            this.logTransportError(i, "Failed to send retransmission of ACK to 2xx response.");
                        });
                        return;
                    }
                    return;
                }
                break;
            case h.Completed:
                if (t >= 300 && t <= 699) {
                    this.ack(e);
                    return;
                }
                break;
            case h.Terminated:
                break;
            default:
                throw new Error(`Invalid state ${this.state}`);
        }
        let r = `Received unexpected ${t} response while in state ${this.state}.`;
        this.logger.warn(r);
    }
    onTransportError(e) {
        this.user.onTransportError && this.user.onTransportError(e), this.stateTransition(h.Terminated, !0);
    }
    typeToString() {
        return "INVITE client transaction";
    }
    ack(e) {
        let t = this.request.ruri, r = this.request.callId, s = this.request.cseq, i = this.request.getHeader("from"), n = e.getHeader("to"), a = this.request.getHeader("via"), g = this.request.getHeader("route");
        if (!i) throw new Error("From undefined.");
        if (!n) throw new Error("To undefined.");
        if (!a) throw new Error("Via undefined.");
        let w = `ACK ${t} SIP/2.0\r
`;
        g && (w += `Route: ${g}\r
`), w += `Via: ${a}\r
`, w += `To: ${n}\r
`, w += `From: ${i}\r
`, w += `Call-ID: ${r}\r
`, w += `CSeq: ${s} ACK\r
`, w += `Max-Forwards: 70\r
`, w += `Content-Length: 0\r
\r
`, this.send(w).catch((u)=>{
            this.logTransportError(u, "Failed to send ACK to non-2xx response.");
        });
    }
    stateTransition(e, t = !1) {
        let r = ()=>{
            throw new Error(`Invalid state transition from ${this.state} to ${e}`);
        };
        switch(e){
            case h.Calling:
                r();
                break;
            case h.Proceeding:
                this.state !== h.Calling && r();
                break;
            case h.Accepted:
            case h.Completed:
                this.state !== h.Calling && this.state !== h.Proceeding && r();
                break;
            case h.Terminated:
                this.state !== h.Calling && this.state !== h.Accepted && this.state !== h.Completed && (t || r());
                break;
            default:
                r();
        }
        this.B && (clearTimeout(this.B), this.B = void 0), e === h.Proceeding, e === h.Completed && (this.D = setTimeout(()=>this.timerD()
        , A.TIMER_D)), e === h.Accepted && (this.M = setTimeout(()=>this.timerM()
        , A.TIMER_M)), e === h.Terminated && this.dispose(), this.setState(e);
    }
    timerA() {}
    timerB() {
        this.logger.debug(`Timer B expired for INVITE client transaction ${this.id}.`), this.state === h.Calling && (this.onRequestTimeout(), this.stateTransition(h.Terminated));
    }
    timerD() {
        this.logger.debug(`Timer D expired for INVITE client transaction ${this.id}.`), this.state === h.Completed && this.stateTransition(h.Terminated);
    }
    timerM() {
        this.logger.debug(`Timer M expired for INVITE client transaction ${this.id}.`), this.state === h.Accepted && this.stateTransition(h.Terminated);
    }
};
var _e = class extends Pe {
    constructor(e, t, r, s, i){
        super(t, r, e.viaBranch, s, i);
        this._request = e, this.user = r;
    }
    get request() {
        return this._request;
    }
};
var O = class extends _e {
    constructor(e, t, r){
        super(e, t, r, h.Proceeding, "sip.transaction.ist");
    }
    dispose() {
        this.stopProgressExtensionTimer(), this.H && (clearTimeout(this.H), this.H = void 0), this.I && (clearTimeout(this.I), this.I = void 0), this.L && (clearTimeout(this.L), this.L = void 0), super.dispose();
    }
    get kind() {
        return "ist";
    }
    receiveRequest(e) {
        switch(this.state){
            case h.Proceeding:
                if (e.method === x.INVITE) {
                    this.lastProvisionalResponse && this.send(this.lastProvisionalResponse).catch((r)=>{
                        this.logTransportError(r, "Failed to send retransmission of provisional response.");
                    });
                    return;
                }
                break;
            case h.Accepted:
                if (e.method === x.INVITE) return;
                break;
            case h.Completed:
                if (e.method === x.INVITE) {
                    if (!this.lastFinalResponse) throw new Error("Last final response undefined.");
                    this.send(this.lastFinalResponse).catch((r)=>{
                        this.logTransportError(r, "Failed to send retransmission of final response.");
                    });
                    return;
                }
                if (e.method === x.ACK) {
                    this.stateTransition(h.Confirmed);
                    return;
                }
                break;
            case h.Confirmed:
                if (e.method === x.INVITE || e.method === x.ACK) return;
                break;
            case h.Terminated:
                if (e.method === x.INVITE || e.method === x.ACK) return;
                break;
            default:
                throw new Error(`Invalid state ${this.state}`);
        }
        let t = `INVITE server transaction received unexpected ${e.method} request while in state ${this.state}.`;
        this.logger.warn(t);
    }
    receiveResponse(e, t) {
        if (e < 100 || e > 699) throw new Error(`Invalid status code ${e}`);
        switch(this.state){
            case h.Proceeding:
                if (e >= 100 && e <= 199) {
                    this.lastProvisionalResponse = t, e > 100 && this.startProgressExtensionTimer(), this.send(t).catch((s)=>{
                        this.logTransportError(s, "Failed to send 1xx response.");
                    });
                    return;
                }
                if (e >= 200 && e <= 299) {
                    this.lastFinalResponse = t, this.stateTransition(h.Accepted), this.send(t).catch((s)=>{
                        this.logTransportError(s, "Failed to send 2xx response.");
                    });
                    return;
                }
                if (e >= 300 && e <= 699) {
                    this.lastFinalResponse = t, this.stateTransition(h.Completed), this.send(t).catch((s)=>{
                        this.logTransportError(s, "Failed to send non-2xx final response.");
                    });
                    return;
                }
                break;
            case h.Accepted:
                if (e >= 200 && e <= 299) {
                    this.send(t).catch((s)=>{
                        this.logTransportError(s, "Failed to send 2xx response.");
                    });
                    return;
                }
                break;
            case h.Completed:
                break;
            case h.Confirmed:
                break;
            case h.Terminated:
                break;
            default:
                throw new Error(`Invalid state ${this.state}`);
        }
        let r = `INVITE server transaction received unexpected ${e} response from TU while in state ${this.state}.`;
        throw this.logger.error(r), new Error(r);
    }
    retransmitAcceptedResponse() {
        this.state === h.Accepted && this.lastFinalResponse && this.send(this.lastFinalResponse).catch((e)=>{
            this.logTransportError(e, "Failed to send 2xx response.");
        });
    }
    onTransportError(e) {
        this.user.onTransportError && this.user.onTransportError(e);
    }
    typeToString() {
        return "INVITE server transaction";
    }
    stateTransition(e) {
        let t = ()=>{
            throw new Error(`Invalid state transition from ${this.state} to ${e}`);
        };
        switch(e){
            case h.Proceeding:
                t();
                break;
            case h.Accepted:
            case h.Completed:
                this.state !== h.Proceeding && t();
                break;
            case h.Confirmed:
                this.state !== h.Completed && t();
                break;
            case h.Terminated:
                this.state !== h.Accepted && this.state !== h.Completed && this.state !== h.Confirmed && t();
                break;
            default:
                t();
        }
        this.stopProgressExtensionTimer(), e === h.Accepted && (this.L = setTimeout(()=>this.timerL()
        , A.TIMER_L)), e === h.Completed && (this.H = setTimeout(()=>this.timerH()
        , A.TIMER_H)), e === h.Confirmed && (this.I = setTimeout(()=>this.timerI()
        , A.TIMER_I)), e === h.Terminated && this.dispose(), this.setState(e);
    }
    startProgressExtensionTimer() {
        this.progressExtensionTimer === void 0 && (this.progressExtensionTimer = setInterval(()=>{
            if (this.logger.debug(`Progress extension timer expired for INVITE server transaction ${this.id}.`), !this.lastProvisionalResponse) throw new Error("Last provisional response undefined.");
            this.send(this.lastProvisionalResponse).catch((e)=>{
                this.logTransportError(e, "Failed to send retransmission of provisional response.");
            });
        }, A.PROVISIONAL_RESPONSE_INTERVAL));
    }
    stopProgressExtensionTimer() {
        this.progressExtensionTimer !== void 0 && (clearInterval(this.progressExtensionTimer), this.progressExtensionTimer = void 0);
    }
    timerG() {}
    timerH() {
        this.logger.debug(`Timer H expired for INVITE server transaction ${this.id}.`), this.state === h.Completed && (this.logger.warn("ACK to negative final response was never received, terminating transaction."), this.stateTransition(h.Terminated));
    }
    timerI() {
        this.logger.debug(`Timer I expired for INVITE server transaction ${this.id}.`), this.stateTransition(h.Terminated);
    }
    timerL() {
        this.logger.debug(`Timer L expired for INVITE server transaction ${this.id}.`), this.state === h.Accepted && this.stateTransition(h.Terminated);
    }
};
var D = class extends ve {
    constructor(e, t, r){
        super(e, t, r, h.Trying, "sip.transaction.nict");
        this.F = setTimeout(()=>this.timerF()
        , A.TIMER_F), this.send(e.toString()).catch((s)=>{
            this.logTransportError(s, "Failed to send initial outgoing request.");
        });
    }
    dispose() {
        this.F && (clearTimeout(this.F), this.F = void 0), this.K && (clearTimeout(this.K), this.K = void 0), super.dispose();
    }
    get kind() {
        return "nict";
    }
    receiveResponse(e) {
        let t = e.statusCode;
        if (!t || t < 100 || t > 699) throw new Error(`Invalid status code ${t}`);
        switch(this.state){
            case h.Trying:
                if (t >= 100 && t <= 199) {
                    this.stateTransition(h.Proceeding), this.user.receiveResponse && this.user.receiveResponse(e);
                    return;
                }
                if (t >= 200 && t <= 699) {
                    if (this.stateTransition(h.Completed), t === 408) {
                        this.onRequestTimeout();
                        return;
                    }
                    this.user.receiveResponse && this.user.receiveResponse(e);
                    return;
                }
                break;
            case h.Proceeding:
                if (t >= 100 && t <= 199 && this.user.receiveResponse) return this.user.receiveResponse(e);
                if (t >= 200 && t <= 699) {
                    if (this.stateTransition(h.Completed), t === 408) {
                        this.onRequestTimeout();
                        return;
                    }
                    this.user.receiveResponse && this.user.receiveResponse(e);
                    return;
                }
                break;
            case h.Completed:
                return;
            case h.Terminated:
                return;
            default:
                throw new Error(`Invalid state ${this.state}`);
        }
        let r = `Non-INVITE client transaction received unexpected ${t} response while in state ${this.state}.`;
        this.logger.warn(r);
    }
    onTransportError(e) {
        this.user.onTransportError && this.user.onTransportError(e), this.stateTransition(h.Terminated, !0);
    }
    typeToString() {
        return "non-INVITE client transaction";
    }
    stateTransition(e, t = !1) {
        let r = ()=>{
            throw new Error(`Invalid state transition from ${this.state} to ${e}`);
        };
        switch(e){
            case h.Trying:
                r();
                break;
            case h.Proceeding:
                this.state !== h.Trying && r();
                break;
            case h.Completed:
                this.state !== h.Trying && this.state !== h.Proceeding && r();
                break;
            case h.Terminated:
                this.state !== h.Trying && this.state !== h.Proceeding && this.state !== h.Completed && (t || r());
                break;
            default:
                r();
        }
        e === h.Completed && (this.F && (clearTimeout(this.F), this.F = void 0), this.K = setTimeout(()=>this.timerK()
        , A.TIMER_K)), e === h.Terminated && this.dispose(), this.setState(e);
    }
    timerF() {
        this.logger.debug(`Timer F expired for non-INVITE client transaction ${this.id}.`), (this.state === h.Trying || this.state === h.Proceeding) && (this.onRequestTimeout(), this.stateTransition(h.Terminated));
    }
    timerK() {
        this.state === h.Completed && this.stateTransition(h.Terminated);
    }
};
var k = class extends _e {
    constructor(e, t, r){
        super(e, t, r, h.Trying, "sip.transaction.nist");
    }
    dispose() {
        this.J && (clearTimeout(this.J), this.J = void 0), super.dispose();
    }
    get kind() {
        return "nist";
    }
    receiveRequest(e) {
        switch(this.state){
            case h.Trying:
                break;
            case h.Proceeding:
                if (!this.lastResponse) throw new Error("Last response undefined.");
                this.send(this.lastResponse).catch((t)=>{
                    this.logTransportError(t, "Failed to send retransmission of provisional response.");
                });
                break;
            case h.Completed:
                if (!this.lastResponse) throw new Error("Last response undefined.");
                this.send(this.lastResponse).catch((t)=>{
                    this.logTransportError(t, "Failed to send retransmission of final response.");
                });
                break;
            case h.Terminated:
                break;
            default:
                throw new Error(`Invalid state ${this.state}`);
        }
    }
    receiveResponse(e, t) {
        if (e < 100 || e > 699) throw new Error(`Invalid status code ${e}`);
        if (e > 100 && e <= 199) throw new Error("Provisional response other than 100 not allowed.");
        switch(this.state){
            case h.Trying:
                if (this.lastResponse = t, e >= 100 && e < 200) {
                    this.stateTransition(h.Proceeding), this.send(t).catch((s)=>{
                        this.logTransportError(s, "Failed to send provisional response.");
                    });
                    return;
                }
                if (e >= 200 && e <= 699) {
                    this.stateTransition(h.Completed), this.send(t).catch((s)=>{
                        this.logTransportError(s, "Failed to send final response.");
                    });
                    return;
                }
                break;
            case h.Proceeding:
                if (this.lastResponse = t, e >= 200 && e <= 699) {
                    this.stateTransition(h.Completed), this.send(t).catch((s)=>{
                        this.logTransportError(s, "Failed to send final response.");
                    });
                    return;
                }
                break;
            case h.Completed:
                return;
            case h.Terminated:
                break;
            default:
                throw new Error(`Invalid state ${this.state}`);
        }
        let r = `Non-INVITE server transaction received unexpected ${e} response from TU while in state ${this.state}.`;
        throw this.logger.error(r), new Error(r);
    }
    onTransportError(e) {
        this.user.onTransportError && this.user.onTransportError(e), this.stateTransition(h.Terminated, !0);
    }
    typeToString() {
        return "non-INVITE server transaction";
    }
    stateTransition(e, t = !1) {
        let r = ()=>{
            throw new Error(`Invalid state transition from ${this.state} to ${e}`);
        };
        switch(e){
            case h.Trying:
                r();
                break;
            case h.Proceeding:
                this.state !== h.Trying && r();
                break;
            case h.Completed:
                this.state !== h.Trying && this.state !== h.Proceeding && r();
                break;
            case h.Terminated:
                this.state !== h.Proceeding && this.state !== h.Completed && (t || r());
                break;
            default:
                r();
        }
        e === h.Completed && (this.J = setTimeout(()=>this.timerJ()
        , A.TIMER_J)), e === h.Terminated && this.dispose(), this.setState(e);
    }
    timerJ() {
        this.logger.debug(`Timer J expired for NON-INVITE server transaction ${this.id}.`), this.state === h.Completed && this.stateTransition(h.Terminated);
    }
};
var I = class {
    constructor(e, t, r, s){
        this.transactionConstructor = e, this.core = t, this.message = r, this.delegate = s, this.challenged = !1, this.stale = !1, this.logger = this.loggerFactory.getLogger("sip.user-agent-client"), this.init();
    }
    dispose() {
        this.transaction.dispose();
    }
    get loggerFactory() {
        return this.core.loggerFactory;
    }
    get transaction() {
        if (!this._transaction) throw new Error("Transaction undefined.");
        return this._transaction;
    }
    cancel(e, t = {}) {
        if (!this.transaction) throw new Error("Transaction undefined.");
        if (!this.message.to) throw new Error("To undefined.");
        if (!this.message.from) throw new Error("From undefined.");
        let r = this.core.makeOutgoingRequestMessage(x.CANCEL, this.message.ruri, this.message.from.uri, this.message.to.uri, {
            toTag: this.message.toTag,
            fromTag: this.message.fromTag,
            callId: this.message.callId,
            cseq: this.message.cseq
        }, t.extraHeaders);
        return r.branch = this.message.branch, this.message.headers.Route && (r.headers.Route = this.message.headers.Route), e && r.setHeader("Reason", e), this.transaction.state === h.Proceeding ? new I(D, this.core, r) : this.transaction.addStateChangeListener(()=>{
            this.transaction && this.transaction.state === h.Proceeding && new I(D, this.core, r);
        }, {
            once: !0
        }), r;
    }
    authenticationGuard(e, t) {
        let r = e.statusCode;
        if (!r) throw new Error("Response status code undefined.");
        if (r !== 401 && r !== 407) return !0;
        let s, i;
        if (r === 401 ? (s = e.parseHeader("www-authenticate"), i = "authorization") : (s = e.parseHeader("proxy-authenticate"), i = "proxy-authorization"), !s) return this.logger.warn(r + " with wrong or missing challenge, cannot authenticate"), !0;
        if (this.challenged && (this.stale || s.stale !== !0)) return this.logger.warn(r + " apparently in authentication loop, cannot authenticate"), !0;
        if (!this.credentials && (this.credentials = this.core.configuration.authenticationFactory(), !this.credentials)) return this.logger.warn("Unable to obtain credentials, cannot authenticate"), !0;
        if (!this.credentials.authenticate(this.message, s)) return !0;
        this.challenged = !0, s.stale && (this.stale = !0);
        let n = this.message.cseq += 1;
        return t && t.localSequenceNumber && (t.incrementLocalSequenceNumber(), n = this.message.cseq = t.localSequenceNumber), this.message.setHeader("cseq", n + " " + this.message.method), this.message.setHeader(i, this.credentials.toString()), this.init(), !1;
    }
    onRequestTimeout() {
        this.logger.warn("User agent client request timed out. Generating internal 408 Request Timeout.");
        let e = new G;
        e.statusCode = 408, e.reasonPhrase = "Request Timeout", this.receiveResponse(e);
    }
    onTransportError(e) {
        this.logger.error(e.message), this.logger.error("User agent client request transport error. Generating internal 503 Service Unavailable.");
        let t = new G;
        t.statusCode = 503, t.reasonPhrase = "Service Unavailable", this.receiveResponse(t);
    }
    receiveResponse(e) {
        if (!this.authenticationGuard(e)) return;
        let t = e.statusCode ? e.statusCode.toString() : "";
        if (!t) throw new Error("Response status code undefined.");
        switch(!0){
            case /^100$/.test(t):
                this.delegate && this.delegate.onTrying && this.delegate.onTrying({
                    message: e
                });
                break;
            case /^1[0-9]{2}$/.test(t):
                this.delegate && this.delegate.onProgress && this.delegate.onProgress({
                    message: e
                });
                break;
            case /^2[0-9]{2}$/.test(t):
                this.delegate && this.delegate.onAccept && this.delegate.onAccept({
                    message: e
                });
                break;
            case /^3[0-9]{2}$/.test(t):
                this.delegate && this.delegate.onRedirect && this.delegate.onRedirect({
                    message: e
                });
                break;
            case /^[4-6][0-9]{2}$/.test(t):
                this.delegate && this.delegate.onReject && this.delegate.onReject({
                    message: e
                });
                break;
            default:
                throw new Error(`Invalid status code ${t}`);
        }
    }
    init() {
        let e = {
            loggerFactory: this.loggerFactory,
            onRequestTimeout: ()=>this.onRequestTimeout()
            ,
            onStateChange: (s)=>{
                s === h.Terminated && (this.core.userAgentClients.delete(r), t === this._transaction && this.dispose());
            },
            onTransportError: (s)=>this.onTransportError(s)
            ,
            receiveResponse: (s)=>this.receiveResponse(s)
        }, t = new this.transactionConstructor(this.message, this.core.transport, e);
        this._transaction = t;
        let r = t.id + t.request.method;
        this.core.userAgentClients.set(r, this);
    }
};
var Ze = class extends I {
    constructor(e, t, r){
        let s = e.createOutgoingRequestMessage(x.BYE, r);
        super(D, e.userAgentCore, s, t);
        e.dispose();
    }
};
var F = class {
    constructor(e, t, r, s){
        this.transactionConstructor = e, this.core = t, this.message = r, this.delegate = s, this.logger = this.loggerFactory.getLogger("sip.user-agent-server"), this.toTag = r.toTag ? r.toTag : he(), this.init();
    }
    dispose() {
        this.transaction.dispose();
    }
    get loggerFactory() {
        return this.core.loggerFactory;
    }
    get transaction() {
        if (!this._transaction) throw new Error("Transaction undefined.");
        return this._transaction;
    }
    accept(e = {
        statusCode: 200
    }) {
        if (!this.acceptable) throw new z(`${this.message.method} not acceptable in state ${this.transaction.state}.`);
        let t = e.statusCode;
        if (t < 200 || t > 299) throw new TypeError(`Invalid statusCode: ${t}`);
        return this.reply(e);
    }
    progress(e = {
        statusCode: 180
    }) {
        if (!this.progressable) throw new z(`${this.message.method} not progressable in state ${this.transaction.state}.`);
        let t = e.statusCode;
        if (t < 101 || t > 199) throw new TypeError(`Invalid statusCode: ${t}`);
        return this.reply(e);
    }
    redirect(e, t = {
        statusCode: 302
    }) {
        if (!this.redirectable) throw new z(`${this.message.method} not redirectable in state ${this.transaction.state}.`);
        let r = t.statusCode;
        if (r < 300 || r > 399) throw new TypeError(`Invalid statusCode: ${r}`);
        let s = new Array;
        return e.forEach((n)=>s.push(`Contact: ${n.toString()}`)
        ), t.extraHeaders = (t.extraHeaders || []).concat(s), this.reply(t);
    }
    reject(e = {
        statusCode: 480
    }) {
        if (!this.rejectable) throw new z(`${this.message.method} not rejectable in state ${this.transaction.state}.`);
        let t = e.statusCode;
        if (t < 400 || t > 699) throw new TypeError(`Invalid statusCode: ${t}`);
        return this.reply(e);
    }
    trying(e) {
        if (!this.tryingable) throw new z(`${this.message.method} not tryingable in state ${this.transaction.state}.`);
        return this.reply({
            statusCode: 100
        });
    }
    receiveCancel(e) {
        this.delegate && this.delegate.onCancel && this.delegate.onCancel(e);
    }
    get acceptable() {
        if (this.transaction instanceof O) return this.transaction.state === h.Proceeding || this.transaction.state === h.Accepted;
        if (this.transaction instanceof k) return this.transaction.state === h.Trying || this.transaction.state === h.Proceeding;
        throw new Error("Unknown transaction type.");
    }
    get progressable() {
        if (this.transaction instanceof O) return this.transaction.state === h.Proceeding;
        if (this.transaction instanceof k) return !1;
        throw new Error("Unknown transaction type.");
    }
    get redirectable() {
        if (this.transaction instanceof O) return this.transaction.state === h.Proceeding;
        if (this.transaction instanceof k) return this.transaction.state === h.Trying || this.transaction.state === h.Proceeding;
        throw new Error("Unknown transaction type.");
    }
    get rejectable() {
        if (this.transaction instanceof O) return this.transaction.state === h.Proceeding;
        if (this.transaction instanceof k) return this.transaction.state === h.Trying || this.transaction.state === h.Proceeding;
        throw new Error("Unknown transaction type.");
    }
    get tryingable() {
        if (this.transaction instanceof O) return this.transaction.state === h.Proceeding;
        if (this.transaction instanceof k) return this.transaction.state === h.Trying;
        throw new Error("Unknown transaction type.");
    }
    reply(e) {
        !e.toTag && e.statusCode !== 100 && (e.toTag = this.toTag), e.userAgent = e.userAgent || this.core.configuration.userAgentHeaderFieldValue, e.supported = e.supported || this.core.configuration.supportedOptionTagsResponse;
        let t = Ue(this.message, e);
        return this.transaction.receiveResponse(e.statusCode, t.message), t;
    }
    init() {
        let e = {
            loggerFactory: this.loggerFactory,
            onStateChange: (s)=>{
                s === h.Terminated && (this.core.userAgentServers.delete(r), this.dispose());
            },
            onTransportError: (s)=>{
                this.logger.error(s.message), this.delegate && this.delegate.onTransportError ? this.delegate.onTransportError(s) : this.logger.error("User agent server response transport error.");
            }
        }, t = new this.transactionConstructor(this.message, this.core.transport, e);
        this._transaction = t;
        let r = t.id;
        this.core.userAgentServers.set(t.id, this);
    }
};
var Je = class extends F {
    constructor(e, t, r){
        super(k, e.userAgentCore, t, r);
    }
};
var ze = class extends I {
    constructor(e, t, r){
        let s = e.createOutgoingRequestMessage(x.INFO, r);
        super(D, e.userAgentCore, s, t);
    }
};
var Xe = class extends F {
    constructor(e, t, r){
        super(k, e.userAgentCore, t, r);
    }
};
var ke = class extends I {
    constructor(e, t, r){
        super(D, e, t, r);
    }
};
var qe = class extends F {
    constructor(e, t, r){
        super(k, e, t, r);
    }
};
var Qe = class extends I {
    constructor(e, t, r){
        let s = e.createOutgoingRequestMessage(x.NOTIFY, r);
        super(D, e.userAgentCore, s, t);
    }
};
function Lt(o) {
    return o.userAgentCore !== void 0;
}
var fe = class extends F {
    constructor(e, t, r){
        let s = Lt(e) ? e.userAgentCore : e;
        super(k, s, t, r);
    }
};
var et = class extends I {
    constructor(e, t, r){
        let s = e.createOutgoingRequestMessage(x.PRACK, r);
        super(D, e.userAgentCore, s, t);
        e.signalingStateTransition(s);
    }
};
var tt = class extends F {
    constructor(e, t, r){
        super(k, e.userAgentCore, t, r);
        e.signalingStateTransition(t), this.dialog = e;
    }
    accept(e = {
        statusCode: 200
    }) {
        return e.body && this.dialog.signalingStateTransition(e.body), super.accept(e);
    }
};
var rt = class extends I {
    constructor(e, t, r){
        let s = e.createOutgoingRequestMessage(x.INVITE, r);
        super(X, e.userAgentCore, s, t);
        this.delegate = t, e.signalingStateTransition(s), e.reinviteUserAgentClient = this, this.dialog = e;
    }
    receiveResponse(e) {
        if (!this.authenticationGuard(e, this.dialog)) return;
        let t = e.statusCode ? e.statusCode.toString() : "";
        if (!t) throw new Error("Response status code undefined.");
        switch(!0){
            case /^100$/.test(t):
                this.delegate && this.delegate.onTrying && this.delegate.onTrying({
                    message: e
                });
                break;
            case /^1[0-9]{2}$/.test(t):
                this.delegate && this.delegate.onProgress && this.delegate.onProgress({
                    message: e,
                    session: this.dialog,
                    prack: (r)=>{
                        throw new Error("Unimplemented.");
                    }
                });
                break;
            case /^2[0-9]{2}$/.test(t):
                this.dialog.signalingStateTransition(e), this.delegate && this.delegate.onAccept && this.delegate.onAccept({
                    message: e,
                    session: this.dialog,
                    ack: (r)=>this.dialog.ack(r)
                });
                break;
            case /^3[0-9]{2}$/.test(t):
                this.dialog.signalingStateRollback(), this.dialog.reinviteUserAgentClient = void 0, this.delegate && this.delegate.onRedirect && this.delegate.onRedirect({
                    message: e
                });
                break;
            case /^[4-6][0-9]{2}$/.test(t):
                this.dialog.signalingStateRollback(), this.dialog.reinviteUserAgentClient = void 0, this.delegate && this.delegate.onReject && this.delegate.onReject({
                    message: e
                });
                break;
            default:
                throw new Error(`Invalid status code ${t}`);
        }
    }
};
var st = class extends F {
    constructor(e, t, r){
        super(O, e.userAgentCore, t, r);
        e.reinviteUserAgentServer = this, this.dialog = e;
    }
    accept(e = {
        statusCode: 200
    }) {
        e.extraHeaders = e.extraHeaders || [], e.extraHeaders = e.extraHeaders.concat(this.dialog.routeSet.map((i)=>`Record-Route: ${i}`
        ));
        let t = super.accept(e), r = this.dialog, s = Object.assign(Object.assign({}, t), {
            session: r
        });
        return e.body && this.dialog.signalingStateTransition(e.body), this.dialog.reConfirm(), s;
    }
    progress(e = {
        statusCode: 180
    }) {
        let t = super.progress(e), r = this.dialog, s = Object.assign(Object.assign({}, t), {
            session: r
        });
        return e.body && this.dialog.signalingStateTransition(e.body), s;
    }
    redirect(e, t = {
        statusCode: 302
    }) {
        throw this.dialog.signalingStateRollback(), this.dialog.reinviteUserAgentServer = void 0, new Error("Unimplemented.");
    }
    reject(e = {
        statusCode: 488
    }) {
        return this.dialog.signalingStateRollback(), this.dialog.reinviteUserAgentServer = void 0, super.reject(e);
    }
};
var it = class extends I {
    constructor(e, t, r){
        let s = e.createOutgoingRequestMessage(x.REFER, r);
        super(D, e.userAgentCore, s, t);
    }
};
function Gt(o) {
    return o.userAgentCore !== void 0;
}
var Ne = class extends F {
    constructor(e, t, r){
        let s = Gt(e) ? e.userAgentCore : e;
        super(k, s, t, r);
    }
};
var xe = class extends re {
    constructor(e, t, r, s){
        super(t, r);
        this.initialTransaction = e, this._signalingState = T.Initial, this.ackWait = !1, this.ackProcessing = !1, this.delegate = s, e instanceof O && (this.ackWait = !0), this.early || this.start2xxRetransmissionTimer(), this.signalingStateTransition(e.request), this.logger = t.loggerFactory.getLogger("sip.invite-dialog"), this.logger.log(`INVITE dialog ${this.id} constructed`);
    }
    dispose() {
        super.dispose(), this._signalingState = T.Closed, this._offer = void 0, this._answer = void 0, this.invite2xxTimer && (clearTimeout(this.invite2xxTimer), this.invite2xxTimer = void 0), this.logger.log(`INVITE dialog ${this.id} destroyed`);
    }
    get sessionState() {
        return this.early ? K.Early : this.ackWait ? K.AckWait : this._signalingState === T.Closed ? K.Terminated : K.Confirmed;
    }
    get signalingState() {
        return this._signalingState;
    }
    get offer() {
        return this._offer;
    }
    get answer() {
        return this._answer;
    }
    confirm() {
        this.early && this.start2xxRetransmissionTimer(), super.confirm();
    }
    reConfirm() {
        this.reinviteUserAgentServer && this.startReInvite2xxRetransmissionTimer();
    }
    ack(e = {}) {
        this.logger.log(`INVITE dialog ${this.id} sending ACK request`);
        let t;
        if (this.reinviteUserAgentClient) {
            if (!(this.reinviteUserAgentClient.transaction instanceof X)) throw new Error("Transaction not instance of InviteClientTransaction.");
            t = this.reinviteUserAgentClient.transaction, this.reinviteUserAgentClient = void 0;
        } else {
            if (!(this.initialTransaction instanceof X)) throw new Error("Initial transaction not instance of InviteClientTransaction.");
            t = this.initialTransaction;
        }
        let r = this.createOutgoingRequestMessage(x.ACK, {
            cseq: t.request.cseq,
            extraHeaders: e.extraHeaders,
            body: e.body
        });
        return t.ackResponse(r), this.signalingStateTransition(r), {
            message: r
        };
    }
    bye(e, t) {
        if (this.logger.log(`INVITE dialog ${this.id} sending BYE request`), this.initialTransaction instanceof O) {
            if (this.early) throw new Error("UAS MUST NOT send a BYE on early dialogs.");
            if (this.ackWait && this.initialTransaction.state !== h.Terminated) throw new Error("UAS MUST NOT send a BYE on a confirmed dialog until it has received an ACK for its 2xx response or until the server transaction times out.");
        }
        return new Ze(this, e, t);
    }
    info(e, t) {
        if (this.logger.log(`INVITE dialog ${this.id} sending INFO request`), this.early) throw new Error("Dialog not confirmed.");
        return new ze(this, e, t);
    }
    invite(e, t) {
        if (this.logger.log(`INVITE dialog ${this.id} sending INVITE request`), this.early) throw new Error("Dialog not confirmed.");
        if (this.reinviteUserAgentClient) throw new Error("There is an ongoing re-INVITE client transaction.");
        if (this.reinviteUserAgentServer) throw new Error("There is an ongoing re-INVITE server transaction.");
        return new rt(this, e, t);
    }
    message(e, t) {
        if (this.logger.log(`INVITE dialog ${this.id} sending MESSAGE request`), this.early) throw new Error("Dialog not confirmed.");
        let r = this.createOutgoingRequestMessage(x.MESSAGE, t);
        return new ke(this.core, r, e);
    }
    notify(e, t) {
        if (this.logger.log(`INVITE dialog ${this.id} sending NOTIFY request`), this.early) throw new Error("Dialog not confirmed.");
        return new Qe(this, e, t);
    }
    prack(e, t) {
        return this.logger.log(`INVITE dialog ${this.id} sending PRACK request`), new et(this, e, t);
    }
    refer(e, t) {
        if (this.logger.log(`INVITE dialog ${this.id} sending REFER request`), this.early) throw new Error("Dialog not confirmed.");
        return new it(this, e, t);
    }
    receiveRequest(e) {
        if (this.logger.log(`INVITE dialog ${this.id} received ${e.method} request`), e.method === x.ACK) {
            if (this.ackWait) {
                if (this.initialTransaction instanceof X) {
                    this.logger.warn(`INVITE dialog ${this.id} received unexpected ${e.method} request, dropping.`);
                    return;
                }
                if (this.initialTransaction.request.cseq !== e.cseq) {
                    this.logger.warn(`INVITE dialog ${this.id} received unexpected ${e.method} request, dropping.`);
                    return;
                }
                this.ackWait = !1;
            } else {
                if (!this.reinviteUserAgentServer) {
                    this.logger.warn(`INVITE dialog ${this.id} received unexpected ${e.method} request, dropping.`);
                    return;
                }
                if (this.reinviteUserAgentServer.transaction.request.cseq !== e.cseq) {
                    this.logger.warn(`INVITE dialog ${this.id} received unexpected ${e.method} request, dropping.`);
                    return;
                }
                this.reinviteUserAgentServer = void 0;
            }
            if (this.signalingStateTransition(e), this.delegate && this.delegate.onAck) {
                let t = this.delegate.onAck({
                    message: e
                });
                t instanceof Promise && (this.ackProcessing = !0, t.then(()=>this.ackProcessing = !1
                ).catch(()=>this.ackProcessing = !1
                ));
            }
            return;
        }
        if (!this.sequenceGuard(e)) {
            this.logger.log(`INVITE dialog ${this.id} rejected out of order ${e.method} request.`);
            return;
        }
        if (super.receiveRequest(e), e.method === x.INVITE) {
            let t = ()=>{
                let i = this.ackWait ? "waiting for initial ACK" : "processing initial ACK";
                this.logger.warn(`INVITE dialog ${this.id} received re-INVITE while ${i}`);
                let n = "RFC 5407 suggests the following to avoid this race condition... ";
                n += " Note: Implementation issues are outside the scope of this document,", n += " but the following tip is provided for avoiding race conditions of", n += " this type.  The caller can delay sending re-INVITE F6 for some period", n += " of time (2 seconds, perhaps), after which the caller can reasonably", n += " assume that its ACK has been received.  Implementors can decouple the", n += " actions of the user (e.g., pressing the hold button) from the actions", n += " of the protocol (the sending of re-INVITE F6), so that the UA can", n += " behave like this.  In this case, it is the implementor's choice as to", n += " how long to wait.  In most cases, such an implementation may be", n += " useful to prevent the type of race condition shown in this section.", n += " This document expresses no preference about whether or not they", n += " should wait for an ACK to be delivered.  After considering the impact", n += " on user experience, implementors should decide whether or not to wait", n += " for a while, because the user experience depends on the", n += " implementation and has no direct bearing on protocol behavior.", this.logger.warn(n);
            }, s = [
                `Retry-After: ${Math.floor(Math.random() * 10) + 1}`
            ];
            if (this.ackProcessing) {
                this.core.replyStateless(e, {
                    statusCode: 500,
                    extraHeaders: s
                }), t();
                return;
            }
            if (this.ackWait && this.signalingState !== T.Stable) {
                this.core.replyStateless(e, {
                    statusCode: 500,
                    extraHeaders: s
                }), t();
                return;
            }
            if (this.reinviteUserAgentServer) {
                this.core.replyStateless(e, {
                    statusCode: 500,
                    extraHeaders: s
                });
                return;
            }
            if (this.reinviteUserAgentClient) {
                this.core.replyStateless(e, {
                    statusCode: 491
                });
                return;
            }
        }
        if (e.method === x.INVITE) {
            let t = e.parseHeader("contact");
            if (!t) throw new Error("Contact undefined.");
            if (!(t instanceof N)) throw new Error("Contact not instance of NameAddrHeader.");
            this.dialogState.remoteTarget = t.uri;
        }
        switch(e.method){
            case x.BYE:
                {
                    let t = new Je(this, e);
                    this.delegate && this.delegate.onBye ? this.delegate.onBye(t) : t.accept(), this.dispose();
                }
                break;
            case x.INFO:
                {
                    let t = new Xe(this, e);
                    this.delegate && this.delegate.onInfo ? this.delegate.onInfo(t) : t.reject({
                        statusCode: 469,
                        extraHeaders: [
                            "Recv-Info:"
                        ]
                    });
                }
                break;
            case x.INVITE:
                {
                    let t = new st(this, e);
                    this.signalingStateTransition(e), this.delegate && this.delegate.onInvite ? this.delegate.onInvite(t) : t.reject({
                        statusCode: 488
                    });
                }
                break;
            case x.MESSAGE:
                {
                    let t = new qe(this.core, e);
                    this.delegate && this.delegate.onMessage ? this.delegate.onMessage(t) : t.accept();
                }
                break;
            case x.NOTIFY:
                {
                    let t = new fe(this, e);
                    this.delegate && this.delegate.onNotify ? this.delegate.onNotify(t) : t.accept();
                }
                break;
            case x.PRACK:
                {
                    let t = new tt(this, e);
                    this.delegate && this.delegate.onPrack ? this.delegate.onPrack(t) : t.accept();
                }
                break;
            case x.REFER:
                {
                    let t = new Ne(this, e);
                    this.delegate && this.delegate.onRefer ? this.delegate.onRefer(t) : t.reject();
                }
                break;
            default:
                this.logger.log(`INVITE dialog ${this.id} received unimplemented ${e.method} request`), this.core.replyStateless(e, {
                    statusCode: 501
                });
                break;
        }
    }
    reliableSequenceGuard(e) {
        let t = e.statusCode;
        if (!t) throw new Error("Status code undefined");
        if (t > 100 && t < 200) {
            let r = e.getHeader("require"), s = e.getHeader("rseq"), i = r && r.includes("100rel") && s ? Number(s) : void 0;
            if (i) {
                if (this.rseq && this.rseq + 1 !== i) return !1;
                this.rseq = this.rseq ? this.rseq + 1 : i;
            }
        }
        return !0;
    }
    signalingStateRollback() {
        (this._signalingState === T.HaveLocalOffer || this.signalingState === T.HaveRemoteOffer) && this._rollbackOffer && this._rollbackAnswer && (this._signalingState = T.Stable, this._offer = this._rollbackOffer, this._answer = this._rollbackAnswer);
    }
    signalingStateTransition(e) {
        let t = ue(e);
        if (!(!t || t.contentDisposition !== "session")) {
            if (this._signalingState === T.Stable && (this._rollbackOffer = this._offer, this._rollbackAnswer = this._answer), e instanceof ee) switch(this._signalingState){
                case T.Initial:
                case T.Stable:
                    this._signalingState = T.HaveRemoteOffer, this._offer = t, this._answer = void 0;
                    break;
                case T.HaveLocalOffer:
                    this._signalingState = T.Stable, this._answer = t;
                    break;
                case T.HaveRemoteOffer:
                    break;
                case T.Closed:
                    break;
                default:
                    throw new Error("Unexpected signaling state.");
            }
            if (e instanceof G) switch(this._signalingState){
                case T.Initial:
                case T.Stable:
                    this._signalingState = T.HaveRemoteOffer, this._offer = t, this._answer = void 0;
                    break;
                case T.HaveLocalOffer:
                    this._signalingState = T.Stable, this._answer = t;
                    break;
                case T.HaveRemoteOffer:
                    break;
                case T.Closed:
                    break;
                default:
                    throw new Error("Unexpected signaling state.");
            }
            if (e instanceof te) switch(this._signalingState){
                case T.Initial:
                case T.Stable:
                    this._signalingState = T.HaveLocalOffer, this._offer = t, this._answer = void 0;
                    break;
                case T.HaveLocalOffer:
                    break;
                case T.HaveRemoteOffer:
                    this._signalingState = T.Stable, this._answer = t;
                    break;
                case T.Closed:
                    break;
                default:
                    throw new Error("Unexpected signaling state.");
            }
            if (Ke(e)) switch(this._signalingState){
                case T.Initial:
                case T.Stable:
                    this._signalingState = T.HaveLocalOffer, this._offer = t, this._answer = void 0;
                    break;
                case T.HaveLocalOffer:
                    break;
                case T.HaveRemoteOffer:
                    this._signalingState = T.Stable, this._answer = t;
                    break;
                case T.Closed:
                    break;
                default:
                    throw new Error("Unexpected signaling state.");
            }
        }
    }
    start2xxRetransmissionTimer() {
        if (this.initialTransaction instanceof O) {
            let e = this.initialTransaction, t = A.T1, r = ()=>{
                if (!this.ackWait) {
                    this.invite2xxTimer = void 0;
                    return;
                }
                this.logger.log("No ACK for 2xx response received, attempting retransmission"), e.retransmitAcceptedResponse(), t = Math.min(t * 2, A.T2), this.invite2xxTimer = setTimeout(r, t);
            };
            this.invite2xxTimer = setTimeout(r, t);
            let s = ()=>{
                e.state === h.Terminated && (e.removeStateChangeListener(s), this.invite2xxTimer && (clearTimeout(this.invite2xxTimer), this.invite2xxTimer = void 0), this.ackWait && (this.delegate && this.delegate.onAckTimeout ? this.delegate.onAckTimeout() : this.bye()));
            };
            e.addStateChangeListener(s);
        }
    }
    startReInvite2xxRetransmissionTimer() {
        if (this.reinviteUserAgentServer && this.reinviteUserAgentServer.transaction instanceof O) {
            let e = this.reinviteUserAgentServer.transaction, t = A.T1, r = ()=>{
                if (!this.reinviteUserAgentServer) {
                    this.invite2xxTimer = void 0;
                    return;
                }
                this.logger.log("No ACK for 2xx response received, attempting retransmission"), e.retransmitAcceptedResponse(), t = Math.min(t * 2, A.T2), this.invite2xxTimer = setTimeout(r, t);
            };
            this.invite2xxTimer = setTimeout(r, t);
            let s = ()=>{
                e.state === h.Terminated && (e.removeStateChangeListener(s), this.invite2xxTimer && (clearTimeout(this.invite2xxTimer), this.invite2xxTimer = void 0), this.reinviteUserAgentServer);
            };
            e.addStateChangeListener(s);
        }
    }
};
var C;
(function(o) {
    o.Initial = "Initial", o.NotifyWait = "NotifyWait", o.Pending = "Pending", o.Active = "Active", o.Terminated = "Terminated";
})(C || (C = {}));
var Q = [
    x.ACK,
    x.BYE,
    x.CANCEL,
    x.INFO,
    x.INVITE,
    x.MESSAGE,
    x.NOTIFY,
    x.OPTIONS,
    x.PRACK,
    x.REFER,
    x.REGISTER,
    x.SUBSCRIBE
];
var nt = class extends I {
    constructor(e, t, r){
        let s = e.createOutgoingRequestMessage(x.SUBSCRIBE, r);
        super(D, e.userAgentCore, s, t);
        this.dialog = e;
    }
    waitNotifyStop() {}
    receiveResponse(e) {
        if (e.statusCode && e.statusCode >= 200 && e.statusCode < 300) {
            let t = e.getHeader("Expires");
            if (!t) this.logger.warn("Expires header missing in a 200-class response to SUBSCRIBE");
            else {
                let r = Number(t);
                this.dialog.subscriptionExpires > r && (this.dialog.subscriptionExpires = r);
            }
        }
        e.statusCode && e.statusCode >= 400 && e.statusCode < 700 && [
            404,
            405,
            410,
            416,
            480,
            481,
            482,
            483,
            484,
            485,
            489,
            501,
            604
        ].includes(e.statusCode) && this.dialog.terminate(), super.receiveResponse(e);
    }
};
var Be = class extends re {
    constructor(e, t, r, s, i, n){
        super(s, i);
        this.delegate = n, this._autoRefresh = !1, this._subscriptionEvent = e, this._subscriptionExpires = t, this._subscriptionExpiresInitial = t, this._subscriptionExpiresLastSet = Math.floor(Date.now() / 1000), this._subscriptionRefresh = void 0, this._subscriptionRefreshLastSet = void 0, this._subscriptionState = r, this.logger = s.loggerFactory.getLogger("sip.subscribe-dialog"), this.logger.log(`SUBSCRIBE dialog ${this.id} constructed`);
    }
    static initialDialogStateForSubscription(e, t) {
        let r = !1, s = t.getHeaders("record-route"), i = t.parseHeader("contact");
        if (!i) throw new Error("Contact undefined.");
        if (!(i instanceof N)) throw new Error("Contact not instance of NameAddrHeader.");
        let n = i.uri, a = e.cseq, g = void 0, w = e.callId, u = e.fromTag, v = t.fromTag;
        if (!w) throw new Error("Call id undefined.");
        if (!u) throw new Error("From tag undefined.");
        if (!v) throw new Error("To tag undefined.");
        if (!e.from) throw new Error("From undefined.");
        if (!e.to) throw new Error("To undefined.");
        let E = e.from.uri, H = e.to.uri, S = !1;
        return {
            id: w + u + v,
            early: S,
            callId: w,
            localTag: u,
            remoteTag: v,
            localSequenceNumber: a,
            remoteSequenceNumber: g,
            localURI: E,
            remoteURI: H,
            remoteTarget: n,
            routeSet: s,
            secure: r
        };
    }
    dispose() {
        super.dispose(), this.N && (clearTimeout(this.N), this.N = void 0), this.refreshTimerClear(), this.logger.log(`SUBSCRIBE dialog ${this.id} destroyed`);
    }
    get autoRefresh() {
        return this._autoRefresh;
    }
    set autoRefresh(e) {
        this._autoRefresh = !0, this.refreshTimerSet();
    }
    get subscriptionEvent() {
        return this._subscriptionEvent;
    }
    get subscriptionExpires() {
        let e = Math.floor(Date.now() / 1000) - this._subscriptionExpiresLastSet, t = this._subscriptionExpires - e;
        return Math.max(t, 0);
    }
    set subscriptionExpires(e) {
        if (e < 0) throw new Error("Expires must be greater than or equal to zero.");
        if (this._subscriptionExpires = e, this._subscriptionExpiresLastSet = Math.floor(Date.now() / 1000), this.autoRefresh) {
            let t = this.subscriptionRefresh;
            (t === void 0 || t >= e) && this.refreshTimerSet();
        }
    }
    get subscriptionExpiresInitial() {
        return this._subscriptionExpiresInitial;
    }
    get subscriptionRefresh() {
        if (this._subscriptionRefresh === void 0 || this._subscriptionRefreshLastSet === void 0) return;
        let e = Math.floor(Date.now() / 1000) - this._subscriptionRefreshLastSet, t = this._subscriptionRefresh - e;
        return Math.max(t, 0);
    }
    get subscriptionState() {
        return this._subscriptionState;
    }
    receiveRequest(e) {
        if (this.logger.log(`SUBSCRIBE dialog ${this.id} received ${e.method} request`), !this.sequenceGuard(e)) {
            this.logger.log(`SUBSCRIBE dialog ${this.id} rejected out of order ${e.method} request.`);
            return;
        }
        switch(super.receiveRequest(e), e.method){
            case x.NOTIFY:
                this.onNotify(e);
                break;
            default:
                this.logger.log(`SUBSCRIBE dialog ${this.id} received unimplemented ${e.method} request`), this.core.replyStateless(e, {
                    statusCode: 501
                });
                break;
        }
    }
    refresh() {
        let e = "Allow: " + Q.toString(), t = {};
        return t.extraHeaders = (t.extraHeaders || []).slice(), t.extraHeaders.push(e), t.extraHeaders.push("Event: " + this.subscriptionEvent), t.extraHeaders.push("Expires: " + this.subscriptionExpiresInitial), t.extraHeaders.push("Contact: " + this.core.configuration.contact.toString()), this.subscribe(void 0, t);
    }
    subscribe(e, t = {}) {
        if (this.subscriptionState !== C.Pending && this.subscriptionState !== C.Active) throw new Error(`Invalid state ${this.subscriptionState}. May only re-subscribe while in state "pending" or "active".`);
        this.logger.log(`SUBSCRIBE dialog ${this.id} sending SUBSCRIBE request`);
        let r = new nt(this, e, t);
        return this.N && (clearTimeout(this.N), this.N = void 0), this.N = setTimeout(()=>this.timerN()
        , A.TIMER_N), r;
    }
    terminate() {
        this.stateTransition(C.Terminated), this.onTerminated();
    }
    unsubscribe() {
        let e = "Allow: " + Q.toString(), t = {};
        return t.extraHeaders = (t.extraHeaders || []).slice(), t.extraHeaders.push(e), t.extraHeaders.push("Event: " + this.subscriptionEvent), t.extraHeaders.push("Expires: 0"), t.extraHeaders.push("Contact: " + this.core.configuration.contact.toString()), this.subscribe(void 0, t);
    }
    onNotify(e) {
        let t = e.parseHeader("Event").event;
        if (!t || t !== this.subscriptionEvent) {
            this.core.replyStateless(e, {
                statusCode: 489
            });
            return;
        }
        this.N && (clearTimeout(this.N), this.N = void 0);
        let r = e.parseHeader("Subscription-State");
        if (!r || !r.state) {
            this.core.replyStateless(e, {
                statusCode: 489
            });
            return;
        }
        let s = r.state, i = r.expires ? Math.max(r.expires, 0) : void 0;
        switch(s){
            case "pending":
                this.stateTransition(C.Pending, i);
                break;
            case "active":
                this.stateTransition(C.Active, i);
                break;
            case "terminated":
                this.stateTransition(C.Terminated, i);
                break;
            default:
                this.logger.warn("Unrecognized subscription state.");
                break;
        }
        let n = new fe(this, e);
        this.delegate && this.delegate.onNotify ? this.delegate.onNotify(n) : n.accept();
    }
    onRefresh(e) {
        this.delegate && this.delegate.onRefresh && this.delegate.onRefresh(e);
    }
    onTerminated() {
        this.delegate && this.delegate.onTerminated && this.delegate.onTerminated();
    }
    refreshTimerClear() {
        this.refreshTimer && (clearTimeout(this.refreshTimer), this.refreshTimer = void 0);
    }
    refreshTimerSet() {
        if (this.refreshTimerClear(), this.autoRefresh && this.subscriptionExpires > 0) {
            let e = this.subscriptionExpires * 900;
            this._subscriptionRefresh = Math.floor(e / 1000), this._subscriptionRefreshLastSet = Math.floor(Date.now() / 1000), this.refreshTimer = setTimeout(()=>{
                this.refreshTimer = void 0, this._subscriptionRefresh = void 0, this._subscriptionRefreshLastSet = void 0, this.onRefresh(this.refresh());
            }, e);
        }
    }
    stateTransition(e, t) {
        let r = ()=>{
            this.logger.warn(`Invalid subscription state transition from ${this.subscriptionState} to ${e}`);
        };
        switch(e){
            case C.Initial:
                r();
                return;
            case C.NotifyWait:
                r();
                return;
            case C.Pending:
                if (this.subscriptionState !== C.NotifyWait && this.subscriptionState !== C.Pending) {
                    r();
                    return;
                }
                break;
            case C.Active:
                if (this.subscriptionState !== C.NotifyWait && this.subscriptionState !== C.Pending && this.subscriptionState !== C.Active) {
                    r();
                    return;
                }
                break;
            case C.Terminated:
                if (this.subscriptionState !== C.NotifyWait && this.subscriptionState !== C.Pending && this.subscriptionState !== C.Active) {
                    r();
                    return;
                }
                break;
            default:
                r();
                return;
        }
        e === C.Pending && t && (this.subscriptionExpires = t), e === C.Active && t && (this.subscriptionExpires = t), e === C.Terminated && this.dispose(), this._subscriptionState = e;
    }
    timerN() {
        this.logger.warn("Timer N expired for SUBSCRIBE dialog. Timed out waiting for NOTIFY."), this.subscriptionState !== C.Terminated && (this.stateTransition(C.Terminated), this.onTerminated());
    }
};
var M;
(function(o) {
    o[o.error = 0] = "error", o[o.warn = 1] = "warn", o[o.log = 2] = "log", o[o.debug = 3] = "debug";
})(M || (M = {}));
var Le = class {
    constructor(e, t, r){
        this.logger = e, this.category = t, this.label = r;
    }
    error(e) {
        this.genericLog(M.error, e);
    }
    warn(e) {
        this.genericLog(M.warn, e);
    }
    log(e) {
        this.genericLog(M.log, e);
    }
    debug(e) {
        this.genericLog(M.debug, e);
    }
    genericLog(e, t) {
        this.logger.genericLog(e, this.category, this.label, t);
    }
    get level() {
        return this.logger.level;
    }
    set level(e) {
        this.logger.level = e;
    }
};
var ot = class {
    constructor(){
        this.builtinEnabled = !0, this._level = M.log, this.loggers = {}, this.logger = this.getLogger("sip:loggerfactory");
    }
    get level() {
        return this._level;
    }
    set level(e) {
        e >= 0 && e <= 3 ? this._level = e : e > 3 ? this._level = 3 : M.hasOwnProperty(e) ? this._level = e : this.logger.error("invalid 'level' parameter value: " + JSON.stringify(e));
    }
    get connector() {
        return this._connector;
    }
    set connector(e) {
        e ? typeof e == "function" ? this._connector = e : this.logger.error("invalid 'connector' parameter value: " + JSON.stringify(e)) : this._connector = void 0;
    }
    getLogger(e, t) {
        if (t && this.level === 3) return new Le(this, e, t);
        if (this.loggers[e]) return this.loggers[e];
        {
            let r = new Le(this, e);
            return this.loggers[e] = r, r;
        }
    }
    genericLog(e, t, r, s) {
        this.level >= e && this.builtinEnabled && this.print(e, t, r, s), this.connector && this.connector(M[e], t, r, s);
    }
    print(e, t, r, s) {
        if (typeof s == "string") {
            let i = [
                new Date,
                t
            ];
            r && i.push(r), s = i.concat(s).join(" | ");
        }
        switch(e){
            case M.error:
                console.error(s);
                break;
            case M.warn:
                console.warn(s);
                break;
            case M.log:
                console.log(s);
                break;
            case M.debug:
                console.debug(s);
                break;
            default:
                break;
        }
    }
};
var at = class extends I {
    constructor(e, t, r){
        super(X, e, t, r);
        this.confirmedDialogAcks = new Map, this.confirmedDialogs = new Map, this.earlyDialogs = new Map, this.delegate = r;
    }
    dispose() {
        this.earlyDialogs.forEach((e)=>e.dispose()
        ), this.earlyDialogs.clear(), super.dispose();
    }
    onTransportError(e) {
        if (this.transaction.state === h.Calling) return super.onTransportError(e);
        this.logger.error(e.message), this.logger.error("User agent client request transport error while sending ACK.");
    }
    receiveResponse(e) {
        if (!this.authenticationGuard(e)) return;
        let t = e.statusCode ? e.statusCode.toString() : "";
        if (!t) throw new Error("Response status code undefined.");
        switch(!0){
            case /^100$/.test(t):
                this.delegate && this.delegate.onTrying && this.delegate.onTrying({
                    message: e
                });
                return;
            case /^1[0-9]{2}$/.test(t):
                {
                    if (!e.toTag) {
                        this.logger.warn("Non-100 1xx INVITE response received without a to tag, dropping.");
                        return;
                    }
                    if (!e.parseHeader("contact")) {
                        this.logger.error("Non-100 1xx INVITE response received without a Contact header field, dropping.");
                        return;
                    }
                    let s = re.initialDialogStateForUserAgentClient(this.message, e), i = this.earlyDialogs.get(s.id);
                    if (!i) {
                        let a = this.transaction;
                        if (!(a instanceof X)) throw new Error("Transaction not instance of InviteClientTransaction.");
                        i = new xe(a, this.core, s), this.earlyDialogs.set(i.id, i);
                    }
                    if (!i.reliableSequenceGuard(e)) {
                        this.logger.warn("1xx INVITE reliable response received out of order or is a retransmission, dropping.");
                        return;
                    }
                    (i.signalingState === T.Initial || i.signalingState === T.HaveLocalOffer) && i.signalingStateTransition(e);
                    let n = i;
                    this.delegate && this.delegate.onProgress && this.delegate.onProgress({
                        message: e,
                        session: n,
                        prack: (a)=>n.prack(void 0, a)
                    });
                }
                return;
            case /^2[0-9]{2}$/.test(t):
                {
                    if (!e.toTag) {
                        this.logger.error("2xx INVITE response received without a to tag, dropping.");
                        return;
                    }
                    if (!e.parseHeader("contact")) {
                        this.logger.error("2xx INVITE response received without a Contact header field, dropping.");
                        return;
                    }
                    let s = re.initialDialogStateForUserAgentClient(this.message, e), i = this.confirmedDialogs.get(s.id);
                    if (i) {
                        let a = this.confirmedDialogAcks.get(s.id);
                        if (a) {
                            let g = this.transaction;
                            if (!(g instanceof X)) throw new Error("Client transaction not instance of InviteClientTransaction.");
                            g.ackResponse(a.message);
                        }
                        return;
                    }
                    if (i = this.earlyDialogs.get(s.id), i) i.confirm(), i.recomputeRouteSet(e), this.earlyDialogs.delete(i.id), this.confirmedDialogs.set(i.id, i);
                    else {
                        let a = this.transaction;
                        if (!(a instanceof X)) throw new Error("Transaction not instance of InviteClientTransaction.");
                        i = new xe(a, this.core, s), this.confirmedDialogs.set(i.id, i);
                    }
                    (i.signalingState === T.Initial || i.signalingState === T.HaveLocalOffer) && i.signalingStateTransition(e);
                    let n = i;
                    if (this.delegate && this.delegate.onAccept) this.delegate.onAccept({
                        message: e,
                        session: n,
                        ack: (a)=>{
                            let g = n.ack(a);
                            return this.confirmedDialogAcks.set(n.id, g), g;
                        }
                    });
                    else {
                        let a = n.ack();
                        this.confirmedDialogAcks.set(n.id, a);
                    }
                }
                return;
            case /^3[0-9]{2}$/.test(t):
                this.earlyDialogs.forEach((r)=>r.dispose()
                ), this.earlyDialogs.clear(), this.delegate && this.delegate.onRedirect && this.delegate.onRedirect({
                    message: e
                });
                return;
            case /^[4-6][0-9]{2}$/.test(t):
                this.earlyDialogs.forEach((r)=>r.dispose()
                ), this.earlyDialogs.clear(), this.delegate && this.delegate.onReject && this.delegate.onReject({
                    message: e
                });
                return;
            default:
                throw new Error(`Invalid status code ${t}`);
        }
        throw new Error(`Executing what should be an unreachable code path receiving ${t} response.`);
    }
};
var Fe = class extends F {
    constructor(e, t, r){
        super(O, e, t, r);
        this.core = e;
    }
    dispose() {
        this.earlyDialog && this.earlyDialog.dispose(), super.dispose();
    }
    accept(e = {
        statusCode: 200
    }) {
        if (!this.acceptable) throw new z(`${this.message.method} not acceptable in state ${this.transaction.state}.`);
        if (!this.confirmedDialog) if (this.earlyDialog) this.earlyDialog.confirm(), this.confirmedDialog = this.earlyDialog, this.earlyDialog = void 0;
        else {
            let g = this.transaction;
            if (!(g instanceof O)) throw new Error("Transaction not instance of InviteClientTransaction.");
            let w = re.initialDialogStateForUserAgentServer(this.message, this.toTag);
            this.confirmedDialog = new xe(g, this.core, w);
        }
        let t = this.message.getHeaders("record-route").map((g)=>`Record-Route: ${g}`
        ), r = `Contact: ${this.core.configuration.contact.toString()}`, s = "Allow: " + Q.toString();
        if (!e.body) {
            if (this.confirmedDialog.signalingState === T.Stable) e.body = this.confirmedDialog.answer;
            else if (this.confirmedDialog.signalingState === T.Initial || this.confirmedDialog.signalingState === T.HaveRemoteOffer) throw new Error("Response must have a body.");
        }
        e.statusCode = e.statusCode || 200, e.extraHeaders = e.extraHeaders || [], e.extraHeaders = e.extraHeaders.concat(t), e.extraHeaders.push(s), e.extraHeaders.push(r);
        let i = super.accept(e), n = this.confirmedDialog, a = Object.assign(Object.assign({}, i), {
            session: n
        });
        return e.body && this.confirmedDialog.signalingState !== T.Stable && this.confirmedDialog.signalingStateTransition(e.body), a;
    }
    progress(e = {
        statusCode: 180
    }) {
        if (!this.progressable) throw new z(`${this.message.method} not progressable in state ${this.transaction.state}.`);
        if (!this.earlyDialog) {
            let a = this.transaction;
            if (!(a instanceof O)) throw new Error("Transaction not instance of InviteClientTransaction.");
            let g = re.initialDialogStateForUserAgentServer(this.message, this.toTag, !0);
            this.earlyDialog = new xe(a, this.core, g);
        }
        let t = this.message.getHeaders("record-route").map((a)=>`Record-Route: ${a}`
        ), r = `Contact: ${this.core.configuration.contact}`;
        e.extraHeaders = e.extraHeaders || [], e.extraHeaders = e.extraHeaders.concat(t), e.extraHeaders.push(r);
        let s = super.progress(e), i = this.earlyDialog, n = Object.assign(Object.assign({}, s), {
            session: i
        });
        return e.body && this.earlyDialog.signalingState !== T.Stable && this.earlyDialog.signalingStateTransition(e.body), n;
    }
    redirect(e, t = {
        statusCode: 302
    }) {
        return super.redirect(e, t);
    }
    reject(e = {
        statusCode: 486
    }) {
        return super.reject(e);
    }
};
var ct = class extends I {
    constructor(e, t, r){
        super(D, e, t, r);
    }
};
var dt = class extends I {
    constructor(e, t, r){
        super(D, e, t, r);
    }
};
var ht = class extends F {
    constructor(e, t, r){
        super(k, e, t, r);
        this.core = e;
    }
};
var lt = class extends I {
    constructor(e, t, r){
        let s = t.getHeader("Event");
        if (!s) throw new Error("Event undefined");
        let i = t.getHeader("Expires");
        if (!i) throw new Error("Expires undefined");
        super(D, e, t, r);
        this.delegate = r, this.subscriberId = t.callId + t.fromTag + s, this.subscriptionExpiresRequested = this.subscriptionExpires = Number(i), this.subscriptionEvent = s, this.subscriptionState = C.NotifyWait, this.waitNotifyStart();
    }
    dispose() {
        super.dispose();
    }
    onNotify(e) {
        let t = e.message.parseHeader("Event").event;
        if (!t || t !== this.subscriptionEvent) {
            this.logger.warn("Failed to parse event."), e.reject({
                statusCode: 489
            });
            return;
        }
        let r = e.message.parseHeader("Subscription-State");
        if (!r || !r.state) {
            this.logger.warn("Failed to parse subscription state."), e.reject({
                statusCode: 489
            });
            return;
        }
        let s = r.state;
        switch(s){
            case "pending":
                break;
            case "active":
                break;
            case "terminated":
                break;
            default:
                this.logger.warn(`Invalid subscription state ${s}`), e.reject({
                    statusCode: 489
                });
                return;
        }
        if (s !== "terminated" && !e.message.parseHeader("contact")) {
            this.logger.warn("Failed to parse contact."), e.reject({
                statusCode: 489
            });
            return;
        }
        if (this.dialog) throw new Error("Dialog already created. This implementation only supports install of single subscriptions.");
        switch(this.waitNotifyStop(), this.subscriptionExpires = r.expires ? Math.min(this.subscriptionExpires, Math.max(r.expires, 0)) : this.subscriptionExpires, s){
            case "pending":
                this.subscriptionState = C.Pending;
                break;
            case "active":
                this.subscriptionState = C.Active;
                break;
            case "terminated":
                this.subscriptionState = C.Terminated;
                break;
            default:
                throw new Error(`Unrecognized state ${s}.`);
        }
        if (this.subscriptionState !== C.Terminated) {
            let i = Be.initialDialogStateForSubscription(this.message, e.message);
            this.dialog = new Be(this.subscriptionEvent, this.subscriptionExpires, this.subscriptionState, this.core, i);
        }
        if (this.delegate && this.delegate.onNotify) {
            let i = e, n = this.dialog;
            this.delegate.onNotify({
                request: i,
                subscription: n
            });
        } else e.accept();
    }
    waitNotifyStart() {
        this.N || (this.core.subscribers.set(this.subscriberId, this), this.N = setTimeout(()=>this.timerN()
        , A.TIMER_N));
    }
    waitNotifyStop() {
        this.N && (this.core.subscribers.delete(this.subscriberId), clearTimeout(this.N), this.N = void 0);
    }
    receiveResponse(e) {
        if (!!this.authenticationGuard(e)) {
            if (e.statusCode && e.statusCode >= 200 && e.statusCode < 300) {
                let t = e.getHeader("Expires");
                if (!t) this.logger.warn("Expires header missing in a 200-class response to SUBSCRIBE");
                else {
                    let r = Number(t);
                    r > this.subscriptionExpiresRequested && this.logger.warn("Expires header in a 200-class response to SUBSCRIBE with a higher value than the one in the request"), r < this.subscriptionExpires && (this.subscriptionExpires = r);
                }
                this.dialog && this.dialog.subscriptionExpires > this.subscriptionExpires && (this.dialog.subscriptionExpires = this.subscriptionExpires);
            }
            e.statusCode && e.statusCode >= 300 && e.statusCode < 700 && this.waitNotifyStop(), super.receiveResponse(e);
        }
    }
    timerN() {
        this.logger.warn("Timer N expired for SUBSCRIBE user agent client. Timed out waiting for NOTIFY."), this.waitNotifyStop(), this.delegate && this.delegate.onNotifyTimeout && this.delegate.onNotifyTimeout();
    }
};
var ut = class extends F {
    constructor(e, t, r){
        super(k, e, t, r);
        this.core = e;
    }
};
var Dt = [
    "application/sdp",
    "application/dtmf-relay"
], gt = class {
    constructor(e, t = {}){
        this.userAgentClients = new Map, this.userAgentServers = new Map, this.configuration = e, this.delegate = t, this.dialogs = new Map, this.subscribers = new Map, this.logger = e.loggerFactory.getLogger("sip.user-agent-core");
    }
    dispose() {
        this.reset();
    }
    reset() {
        this.dialogs.forEach((e)=>e.dispose()
        ), this.dialogs.clear(), this.subscribers.forEach((e)=>e.dispose()
        ), this.subscribers.clear(), this.userAgentClients.forEach((e)=>e.dispose()
        ), this.userAgentClients.clear(), this.userAgentServers.forEach((e)=>e.dispose()
        ), this.userAgentServers.clear();
    }
    get loggerFactory() {
        return this.configuration.loggerFactory;
    }
    get transport() {
        let e = this.configuration.transportAccessor();
        if (!e) throw new Error("Transport undefined.");
        return e;
    }
    invite(e, t) {
        return new at(this, e, t);
    }
    message(e, t) {
        return new ke(this, e, t);
    }
    publish(e, t) {
        return new ct(this, e, t);
    }
    register(e, t) {
        return new dt(this, e, t);
    }
    subscribe(e, t) {
        return new lt(this, e, t);
    }
    request(e, t) {
        return new I(D, this, e, t);
    }
    makeOutgoingRequestMessage(e, t, r, s, i, n, a) {
        let g = this.configuration.sipjsId, w = this.configuration.displayName, u = this.configuration.viaForceRport, v = this.configuration.hackViaTcp, E = this.configuration.supportedOptionTags.slice();
        e === x.REGISTER && E.push("path", "gruu"), e === x.INVITE && (this.configuration.contact.pubGruu || this.configuration.contact.tempGruu) && E.push("gruu");
        let H = this.configuration.routeSet, S = this.configuration.userAgentHeaderFieldValue, V = this.configuration.viaHost, ce = Object.assign(Object.assign({}, {
            callIdPrefix: g,
            forceRport: u,
            fromDisplayName: w,
            hackViaTcp: v,
            optionTags: E,
            routeSet: H,
            userAgentString: S,
            viaHost: V
        }), i);
        return new te(e, t, r, s, ce, n, a);
    }
    receiveIncomingRequestFromTransport(e) {
        this.receiveRequestFromTransport(e);
    }
    receiveIncomingResponseFromTransport(e) {
        this.receiveResponseFromTransport(e);
    }
    replyStateless(e, t) {
        let r = this.configuration.userAgentHeaderFieldValue, s = this.configuration.supportedOptionTagsResponse;
        t = Object.assign(Object.assign({}, t), {
            userAgent: r,
            supported: s
        });
        let i = Ue(e, t);
        return this.transport.send(i.message).catch((n)=>{
            n instanceof Error && this.logger.error(n.message), this.logger.error(`Transport error occurred sending stateless reply to ${e.method} request.`);
        }), i;
    }
    receiveRequestFromTransport(e) {
        let t = e.viaBranch, r = this.userAgentServers.get(t);
        if (e.method === x.ACK && r && r.transaction.state === h.Accepted && r instanceof Fe) {
            this.logger.warn(`Discarding out of dialog ACK after 2xx response sent on transaction ${t}.`);
            return;
        }
        if (e.method === x.CANCEL) {
            r ? (this.replyStateless(e, {
                statusCode: 200
            }), r.transaction instanceof O && r.transaction.state === h.Proceeding && r instanceof Fe && r.receiveCancel(e)) : this.replyStateless(e, {
                statusCode: 481
            });
            return;
        }
        if (r) {
            r.transaction.receiveRequest(e);
            return;
        }
        this.receiveRequest(e);
    }
    receiveRequest(e) {
        if (!Q.includes(e.method)) {
            let s = "Allow: " + Q.toString();
            this.replyStateless(e, {
                statusCode: 405,
                extraHeaders: [
                    s
                ]
            });
            return;
        }
        if (!e.ruri) throw new Error("Request-URI undefined.");
        if (e.ruri.scheme !== "sip") {
            this.replyStateless(e, {
                statusCode: 416
            });
            return;
        }
        let t = e.ruri, r = (s)=>!!s && s.user === t.user
        ;
        if (!r(this.configuration.aor) && !(r(this.configuration.contact.uri) || r(this.configuration.contact.pubGruu) || r(this.configuration.contact.tempGruu))) {
            this.logger.warn("Request-URI does not point to us."), e.method !== x.ACK && this.replyStateless(e, {
                statusCode: 404
            });
            return;
        }
        if (e.method === x.INVITE && !e.hasHeader("Contact")) {
            this.replyStateless(e, {
                statusCode: 400,
                reasonPhrase: "Missing Contact Header"
            });
            return;
        }
        if (!e.toTag) {
            let s = e.viaBranch;
            if (!this.userAgentServers.has(s) && Array.from(this.userAgentServers.values()).some((n)=>n.transaction.request.fromTag === e.fromTag && n.transaction.request.callId === e.callId && n.transaction.request.cseq === e.cseq
            )) {
                this.replyStateless(e, {
                    statusCode: 482
                });
                return;
            }
        }
        e.toTag ? this.receiveInsideDialogRequest(e) : this.receiveOutsideDialogRequest(e);
    }
    receiveInsideDialogRequest(e) {
        if (e.method === x.NOTIFY) {
            let s = e.parseHeader("Event");
            if (!s || !s.event) {
                this.replyStateless(e, {
                    statusCode: 489
                });
                return;
            }
            let i = e.callId + e.toTag + s.event, n = this.subscribers.get(i);
            if (n) {
                let a = new fe(this, e);
                n.onNotify(a);
                return;
            }
        }
        let t = e.callId + e.toTag + e.fromTag, r = this.dialogs.get(t);
        if (r) {
            if (e.method === x.OPTIONS) {
                let s = "Allow: " + Q.toString(), i = "Accept: " + Dt.toString();
                this.replyStateless(e, {
                    statusCode: 200,
                    extraHeaders: [
                        s,
                        i
                    ]
                });
                return;
            }
            r.receiveRequest(e);
            return;
        }
        e.method !== x.ACK && this.replyStateless(e, {
            statusCode: 481
        });
    }
    receiveOutsideDialogRequest(e) {
        switch(e.method){
            case x.ACK:
                break;
            case x.BYE:
                this.replyStateless(e, {
                    statusCode: 481
                });
                break;
            case x.CANCEL:
                throw new Error(`Unexpected out of dialog request method ${e.method}.`);
            case x.INFO:
                this.replyStateless(e, {
                    statusCode: 405
                });
                break;
            case x.INVITE:
                {
                    let t = new Fe(this, e);
                    this.delegate.onInvite ? this.delegate.onInvite(t) : t.reject();
                }
                break;
            case x.MESSAGE:
                {
                    let t = new qe(this, e);
                    this.delegate.onMessage ? this.delegate.onMessage(t) : t.accept();
                }
                break;
            case x.NOTIFY:
                {
                    let t = new fe(this, e);
                    this.delegate.onNotify ? this.delegate.onNotify(t) : t.reject({
                        statusCode: 405
                    });
                }
                break;
            case x.OPTIONS:
                {
                    let t = "Allow: " + Q.toString(), r = "Accept: " + Dt.toString();
                    this.replyStateless(e, {
                        statusCode: 200,
                        extraHeaders: [
                            t,
                            r
                        ]
                    });
                }
                break;
            case x.REFER:
                {
                    let t = new Ne(this, e);
                    this.delegate.onRefer ? this.delegate.onRefer(t) : t.reject({
                        statusCode: 405
                    });
                }
                break;
            case x.REGISTER:
                {
                    let t = new ht(this, e);
                    this.delegate.onRegister ? this.delegate.onRegister(t) : t.reject({
                        statusCode: 405
                    });
                }
                break;
            case x.SUBSCRIBE:
                {
                    let t = new ut(this, e);
                    this.delegate.onSubscribe ? this.delegate.onSubscribe(t) : t.reject({
                        statusCode: 480
                    });
                }
                break;
            default:
                throw new Error(`Unexpected out of dialog request method ${e.method}.`);
        }
    }
    receiveResponseFromTransport(e) {
        if (e.getHeaders("via").length > 1) {
            this.logger.warn("More than one Via header field present in the response, dropping");
            return;
        }
        let t = e.viaBranch + e.method, r = this.userAgentClients.get(t);
        r ? r.transaction.receiveResponse(e) : this.logger.warn(`Discarding unmatched ${e.statusCode} response to ${e.method} ${t}.`);
    }
};
var $e = class extends L {
    constructor(e){
        super(e || "Unsupported content type.");
    }
};
var pe = class extends L {
    constructor(e){
        super(e || "Request pending.");
    }
};
var ft = class extends L {
    constructor(e){
        super(e || "Unspecified session description handler error.");
    }
};
var Oe = class extends L {
    constructor(){
        super("The session has terminated.");
    }
};
var Te = class extends L {
    constructor(e){
        super(e || "An error occurred during state transition.");
    }
};
var pt = class {
    constructor(e){
        this.incomingAckRequest = e;
    }
    get request() {
        return this.incomingAckRequest.message;
    }
};
var mt = class {
    constructor(e){
        this.incomingByeRequest = e;
    }
    get request() {
        return this.incomingByeRequest.message;
    }
    accept(e) {
        return this.incomingByeRequest.accept(e), Promise.resolve();
    }
    reject(e) {
        return this.incomingByeRequest.reject(e), Promise.resolve();
    }
};
var ne = class {
    constructor(){
        this.listeners = new Array;
    }
    addListener(e, t) {
        let r = (s)=>{
            this.removeListener(r), e(s);
        };
        (t == null ? void 0 : t.once) === !0 ? this.listeners.push(r) : this.listeners.push(e);
    }
    emit(e) {
        this.listeners.slice().forEach((t)=>t(e)
        );
    }
    removeAllListeners() {
        this.listeners = [];
    }
    removeListener(e) {
        this.listeners = this.listeners.filter((t)=>t !== e
        );
    }
    on(e) {
        return this.addListener(e);
    }
    off(e) {
        return this.removeListener(e);
    }
    once(e) {
        return this.addListener(e, {
            once: !0
        });
    }
};
var wt = class {
    constructor(e){
        this.incomingInfoRequest = e;
    }
    get request() {
        return this.incomingInfoRequest.message;
    }
    accept(e) {
        return this.incomingInfoRequest.accept(e), Promise.resolve();
    }
    reject(e) {
        return this.incomingInfoRequest.reject(e), Promise.resolve();
    }
};
var Me = class {
    constructor(e){
        this.incomingMessageRequest = e;
    }
    get request() {
        return this.incomingMessageRequest.message;
    }
    accept(e) {
        return this.incomingMessageRequest.accept(e), Promise.resolve();
    }
    reject(e) {
        return this.incomingMessageRequest.reject(e), Promise.resolve();
    }
};
var Ce = class {
    constructor(e){
        this.incomingNotifyRequest = e;
    }
    get request() {
        return this.incomingNotifyRequest.message;
    }
    accept(e) {
        return this.incomingNotifyRequest.accept(e), Promise.resolve();
    }
    reject(e) {
        return this.incomingNotifyRequest.reject(e), Promise.resolve();
    }
};
var vt = class {
    constructor(e, t){
        this.incomingReferRequest = e, this.session = t;
    }
    get referTo() {
        let e = this.incomingReferRequest.message.parseHeader("refer-to");
        if (!(e instanceof N)) throw new Error("Failed to parse Refer-To header.");
        return e;
    }
    get referredBy() {
        return this.incomingReferRequest.message.getHeader("referred-by");
    }
    get replaces() {
        let e = this.referTo.uri.getHeader("replaces");
        return e instanceof Array ? e[0] : e;
    }
    get request() {
        return this.incomingReferRequest.message;
    }
    accept(e = {
        statusCode: 202
    }) {
        return this.incomingReferRequest.accept(e), Promise.resolve();
    }
    reject(e) {
        return this.incomingReferRequest.reject(e), Promise.resolve();
    }
    makeInviter(e) {
        if (this.inviter) return this.inviter;
        let t = this.referTo.uri.clone();
        t.clearHeaders(), e = e || {};
        let r = (e.extraHeaders || []).slice(), s = this.replaces;
        s && r.push("Replaces: " + decodeURIComponent(s));
        let i = this.referredBy;
        return i && r.push("Referred-By: " + i), e.extraHeaders = r, this.inviter = this.session.userAgent._makeInviter(t, e), this.inviter._referred = this.session, this.session._referral = this.inviter, this.inviter;
    }
};
var m;
(function(o) {
    o.Initial = "Initial", o.Establishing = "Establishing", o.Established = "Established", o.Terminating = "Terminating", o.Terminated = "Terminated";
})(m || (m = {}));
var ye = class {
    constructor(e, t = {}){
        this.pendingReinvite = !1, this.pendingReinviteAck = !1, this._state = m.Initial, this.delegate = t.delegate, this._stateEventEmitter = new ne, this._userAgent = e;
    }
    dispose() {
        switch(this.logger.log(`Session ${this.id} in state ${this._state} is being disposed`), delete this.userAgent._sessions[this.id], this._sessionDescriptionHandler && this._sessionDescriptionHandler.close(), this.state){
            case m.Initial:
                break;
            case m.Establishing:
                break;
            case m.Established:
                return new Promise((e)=>{
                    this._bye({
                        onAccept: ()=>e()
                        ,
                        onRedirect: ()=>e()
                        ,
                        onReject: ()=>e()
                    });
                });
            case m.Terminating:
                break;
            case m.Terminated:
                break;
            default:
                throw new Error("Unknown state.");
        }
        return Promise.resolve();
    }
    get assertedIdentity() {
        return this._assertedIdentity;
    }
    get dialog() {
        return this._dialog;
    }
    get id() {
        return this._id;
    }
    get replacee() {
        return this._replacee;
    }
    get sessionDescriptionHandler() {
        return this._sessionDescriptionHandler;
    }
    get sessionDescriptionHandlerFactory() {
        return this.userAgent.configuration.sessionDescriptionHandlerFactory;
    }
    get sessionDescriptionHandlerModifiers() {
        return this._sessionDescriptionHandlerModifiers || [];
    }
    set sessionDescriptionHandlerModifiers(e) {
        this._sessionDescriptionHandlerModifiers = e.slice();
    }
    get sessionDescriptionHandlerOptions() {
        return this._sessionDescriptionHandlerOptions || {};
    }
    set sessionDescriptionHandlerOptions(e) {
        this._sessionDescriptionHandlerOptions = Object.assign({}, e);
    }
    get sessionDescriptionHandlerModifiersReInvite() {
        return this._sessionDescriptionHandlerModifiersReInvite || [];
    }
    set sessionDescriptionHandlerModifiersReInvite(e) {
        this._sessionDescriptionHandlerModifiersReInvite = e.slice();
    }
    get sessionDescriptionHandlerOptionsReInvite() {
        return this._sessionDescriptionHandlerOptionsReInvite || {};
    }
    set sessionDescriptionHandlerOptionsReInvite(e) {
        this._sessionDescriptionHandlerOptionsReInvite = Object.assign({}, e);
    }
    get state() {
        return this._state;
    }
    get stateChange() {
        return this._stateEventEmitter;
    }
    get userAgent() {
        return this._userAgent;
    }
    bye(e = {}) {
        let t = "Session.bye() may only be called if established session.";
        switch(this.state){
            case m.Initial:
                typeof this.cancel == "function" ? (t += " However Inviter.invite() has not yet been called.", t += " Perhaps you should have called Inviter.cancel()?") : typeof this.reject == "function" && (t += " However Invitation.accept() has not yet been called.", t += " Perhaps you should have called Invitation.reject()?");
                break;
            case m.Establishing:
                typeof this.cancel == "function" ? (t += " However a dialog does not yet exist.", t += " Perhaps you should have called Inviter.cancel()?") : typeof this.reject == "function" && (t += " However Invitation.accept() has not yet been called (or not yet resolved).", t += " Perhaps you should have called Invitation.reject()?");
                break;
            case m.Established:
                {
                    let r = e.requestDelegate, s = this.copyRequestOptions(e.requestOptions);
                    return this._bye(r, s);
                }
            case m.Terminating:
                t += " However this session is already terminating.", typeof this.cancel == "function" ? t += " Perhaps you have already called Inviter.cancel()?" : typeof this.reject == "function" && (t += " Perhaps you have already called Session.bye()?");
                break;
            case m.Terminated:
                t += " However this session is already terminated.";
                break;
            default:
                throw new Error("Unknown state");
        }
        return this.logger.error(t), Promise.reject(new Error(`Invalid session state ${this.state}`));
    }
    info(e = {}) {
        if (this.state !== m.Established) {
            let s = "Session.info() may only be called if established session.";
            return this.logger.error(s), Promise.reject(new Error(`Invalid session state ${this.state}`));
        }
        let t = e.requestDelegate, r = this.copyRequestOptions(e.requestOptions);
        return this._info(t, r);
    }
    invite(e = {}) {
        if (this.logger.log("Session.invite"), this.state !== m.Established) return Promise.reject(new Error(`Invalid session state ${this.state}`));
        if (this.pendingReinvite) return Promise.reject(new pe("Reinvite in progress. Please wait until complete, then try again."));
        this.pendingReinvite = !0, e.sessionDescriptionHandlerModifiers && (this.sessionDescriptionHandlerModifiersReInvite = e.sessionDescriptionHandlerModifiers), e.sessionDescriptionHandlerOptions && (this.sessionDescriptionHandlerOptionsReInvite = e.sessionDescriptionHandlerOptions);
        let t = {
            onAccept: (i)=>{
                let n = ue(i.message);
                if (!n) {
                    this.logger.error("Received 2xx response to re-INVITE without a session description"), this.ackAndBye(i, 400, "Missing session description"), this.stateTransition(m.Terminated), this.pendingReinvite = !1;
                    return;
                }
                if (e.withoutSdp) {
                    let a = {
                        sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptionsReInvite,
                        sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiersReInvite
                    };
                    this.setOfferAndGetAnswer(n, a).then((g)=>{
                        i.ack({
                            body: g
                        });
                    }).catch((g)=>{
                        this.logger.error("Failed to handle offer in 2xx response to re-INVITE"), this.logger.error(g.message), this.state === m.Terminated ? i.ack() : (this.ackAndBye(i, 488, "Bad Media Description"), this.stateTransition(m.Terminated));
                    }).then(()=>{
                        this.pendingReinvite = !1, e.requestDelegate && e.requestDelegate.onAccept && e.requestDelegate.onAccept(i);
                    });
                } else {
                    let a = {
                        sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptionsReInvite,
                        sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiersReInvite
                    };
                    this.setAnswer(n, a).then(()=>{
                        i.ack();
                    }).catch((g)=>{
                        this.logger.error("Failed to handle answer in 2xx response to re-INVITE"), this.logger.error(g.message), this.state !== m.Terminated ? (this.ackAndBye(i, 488, "Bad Media Description"), this.stateTransition(m.Terminated)) : i.ack();
                    }).then(()=>{
                        this.pendingReinvite = !1, e.requestDelegate && e.requestDelegate.onAccept && e.requestDelegate.onAccept(i);
                    });
                }
            },
            onProgress: (i)=>{},
            onRedirect: (i)=>{},
            onReject: (i)=>{
                this.logger.warn("Received a non-2xx response to re-INVITE"), this.pendingReinvite = !1, e.withoutSdp ? e.requestDelegate && e.requestDelegate.onReject && e.requestDelegate.onReject(i) : this.rollbackOffer().catch((n)=>{
                    if (this.logger.error("Failed to rollback offer on non-2xx response to re-INVITE"), this.logger.error(n.message), this.state !== m.Terminated) {
                        if (!this.dialog) throw new Error("Dialog undefined.");
                        let a = [];
                        a.push("Reason: " + this.getReasonHeaderValue(500, "Internal Server Error")), this.dialog.bye(void 0, {
                            extraHeaders: a
                        }), this.stateTransition(m.Terminated);
                    }
                }).then(()=>{
                    e.requestDelegate && e.requestDelegate.onReject && e.requestDelegate.onReject(i);
                });
            },
            onTrying: (i)=>{}
        }, r = e.requestOptions || {};
        if (r.extraHeaders = (r.extraHeaders || []).slice(), r.extraHeaders.push("Allow: " + Q.toString()), r.extraHeaders.push("Contact: " + this._contact), e.withoutSdp) {
            if (!this.dialog) throw this.pendingReinvite = !1, new Error("Dialog undefined.");
            return Promise.resolve(this.dialog.invite(t, r));
        }
        let s = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptionsReInvite,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiersReInvite
        };
        return this.getOffer(s).then((i)=>{
            if (!this.dialog) throw this.pendingReinvite = !1, new Error("Dialog undefined.");
            return r.body = i, this.dialog.invite(t, r);
        }).catch((i)=>{
            throw this.logger.error(i.message), this.logger.error("Failed to send re-INVITE"), this.pendingReinvite = !1, i;
        });
    }
    message(e = {}) {
        if (this.state !== m.Established) {
            let s = "Session.message() may only be called if established session.";
            return this.logger.error(s), Promise.reject(new Error(`Invalid session state ${this.state}`));
        }
        let t = e.requestDelegate, r = this.copyRequestOptions(e.requestOptions);
        return this._message(t, r);
    }
    refer(e, t = {}) {
        if (this.state !== m.Established) {
            let i = "Session.refer() may only be called if established session.";
            return this.logger.error(i), Promise.reject(new Error(`Invalid session state ${this.state}`));
        }
        let r = t.requestDelegate, s = this.copyRequestOptions(t.requestOptions);
        return s.extraHeaders = s.extraHeaders ? s.extraHeaders.concat(this.referExtraHeaders(this.referToString(e))) : this.referExtraHeaders(this.referToString(e)), this._refer(t.onNotify, r, s);
    }
    _bye(e, t) {
        if (!this.dialog) return Promise.reject(new Error("Session dialog undefined."));
        let r = this.dialog;
        switch(r.sessionState){
            case K.Initial:
                throw new Error(`Invalid dialog state ${r.sessionState}`);
            case K.Early:
                throw new Error(`Invalid dialog state ${r.sessionState}`);
            case K.AckWait:
                return this.stateTransition(m.Terminating), new Promise((s)=>{
                    r.delegate = {
                        onAck: ()=>{
                            let i = r.bye(e, t);
                            return this.stateTransition(m.Terminated), s(i), Promise.resolve();
                        },
                        onAckTimeout: ()=>{
                            let i = r.bye(e, t);
                            this.stateTransition(m.Terminated), s(i);
                        }
                    };
                });
            case K.Confirmed:
                {
                    let s = r.bye(e, t);
                    return this.stateTransition(m.Terminated), Promise.resolve(s);
                }
            case K.Terminated:
                throw new Error(`Invalid dialog state ${r.sessionState}`);
            default:
                throw new Error("Unrecognized state.");
        }
    }
    _info(e, t) {
        return this.dialog ? Promise.resolve(this.dialog.info(e, t)) : Promise.reject(new Error("Session dialog undefined."));
    }
    _message(e, t) {
        return this.dialog ? Promise.resolve(this.dialog.message(e, t)) : Promise.reject(new Error("Session dialog undefined."));
    }
    _refer(e, t, r) {
        return this.dialog ? (this.onNotify = e, Promise.resolve(this.dialog.refer(t, r))) : Promise.reject(new Error("Session dialog undefined."));
    }
    ackAndBye(e, t, r) {
        e.ack();
        let s = [];
        t && s.push("Reason: " + this.getReasonHeaderValue(t, r)), e.session.bye(void 0, {
            extraHeaders: s
        });
    }
    onAckRequest(e) {
        if (this.logger.log("Session.onAckRequest"), this.state !== m.Established && this.state !== m.Terminating) return this.logger.error(`ACK received while in state ${this.state}, dropping request`), Promise.resolve();
        let t = this.dialog;
        if (!t) throw new Error("Dialog undefined.");
        let r = {
            sessionDescriptionHandlerOptions: this.pendingReinviteAck ? this.sessionDescriptionHandlerOptionsReInvite : this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.pendingReinviteAck ? this._sessionDescriptionHandlerModifiersReInvite : this._sessionDescriptionHandlerModifiers
        };
        if (this.delegate && this.delegate.onAck) {
            let s = new pt(e);
            this.delegate.onAck(s);
        }
        switch(this.pendingReinviteAck = !1, t.signalingState){
            case T.Initial:
                {
                    this.logger.error(`Invalid signaling state ${t.signalingState}.`);
                    let s = [
                        "Reason: " + this.getReasonHeaderValue(488, "Bad Media Description")
                    ];
                    return t.bye(void 0, {
                        extraHeaders: s
                    }), this.stateTransition(m.Terminated), Promise.resolve();
                }
            case T.Stable:
                {
                    let s = ue(e.message);
                    return s ? s.contentDisposition === "render" ? (this._renderbody = s.content, this._rendertype = s.contentType, Promise.resolve()) : s.contentDisposition !== "session" ? Promise.resolve() : this.setAnswer(s, r).catch((i)=>{
                        this.logger.error(i.message);
                        let n = [
                            "Reason: " + this.getReasonHeaderValue(488, "Bad Media Description")
                        ];
                        t.bye(void 0, {
                            extraHeaders: n
                        }), this.stateTransition(m.Terminated);
                    }) : Promise.resolve();
                }
            case T.HaveLocalOffer:
                {
                    this.logger.error(`Invalid signaling state ${t.signalingState}.`);
                    let s = [
                        "Reason: " + this.getReasonHeaderValue(488, "Bad Media Description")
                    ];
                    return t.bye(void 0, {
                        extraHeaders: s
                    }), this.stateTransition(m.Terminated), Promise.resolve();
                }
            case T.HaveRemoteOffer:
                {
                    this.logger.error(`Invalid signaling state ${t.signalingState}.`);
                    let s = [
                        "Reason: " + this.getReasonHeaderValue(488, "Bad Media Description")
                    ];
                    return t.bye(void 0, {
                        extraHeaders: s
                    }), this.stateTransition(m.Terminated), Promise.resolve();
                }
            case T.Closed:
                throw new Error(`Invalid signaling state ${t.signalingState}.`);
            default:
                throw new Error(`Invalid signaling state ${t.signalingState}.`);
        }
    }
    onByeRequest(e) {
        if (this.logger.log("Session.onByeRequest"), this.state !== m.Established) {
            this.logger.error(`BYE received while in state ${this.state}, dropping request`);
            return;
        }
        if (this.delegate && this.delegate.onBye) {
            let t = new mt(e);
            this.delegate.onBye(t);
        } else e.accept();
        this.stateTransition(m.Terminated);
    }
    onInfoRequest(e) {
        if (this.logger.log("Session.onInfoRequest"), this.state !== m.Established) {
            this.logger.error(`INFO received while in state ${this.state}, dropping request`);
            return;
        }
        if (this.delegate && this.delegate.onInfo) {
            let t = new wt(e);
            this.delegate.onInfo(t);
        } else e.accept();
    }
    onInviteRequest(e) {
        if (this.logger.log("Session.onInviteRequest"), this.state !== m.Established) {
            this.logger.error(`INVITE received while in state ${this.state}, dropping request`);
            return;
        }
        this.pendingReinviteAck = !0;
        let t = [
            "Contact: " + this._contact
        ];
        if (e.message.hasHeader("P-Asserted-Identity")) {
            let s = e.message.getHeader("P-Asserted-Identity");
            if (!s) throw new Error("Header undefined.");
            this._assertedIdentity = R.nameAddrHeaderParse(s);
        }
        let r = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptionsReInvite,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiersReInvite
        };
        this.generateResponseOfferAnswerInDialog(r).then((s)=>{
            let i = e.accept({
                statusCode: 200,
                extraHeaders: t,
                body: s
            });
            this.delegate && this.delegate.onInvite && this.delegate.onInvite(e.message, i.message, 200);
        }).catch((s)=>{
            if (this.logger.error(s.message), this.logger.error("Failed to handle to re-INVITE request"), !this.dialog) throw new Error("Dialog undefined.");
            if (this.logger.error(this.dialog.signalingState), this.dialog.signalingState === T.Stable) {
                let i = e.reject({
                    statusCode: 488
                });
                this.delegate && this.delegate.onInvite && this.delegate.onInvite(e.message, i.message, 488);
                return;
            }
            this.rollbackOffer().then(()=>{
                let i = e.reject({
                    statusCode: 488
                });
                this.delegate && this.delegate.onInvite && this.delegate.onInvite(e.message, i.message, 488);
            }).catch((i)=>{
                this.logger.error(i.message), this.logger.error("Failed to rollback offer on re-INVITE request");
                let n = e.reject({
                    statusCode: 488
                });
                if (this.state !== m.Terminated) {
                    if (!this.dialog) throw new Error("Dialog undefined.");
                    [].push("Reason: " + this.getReasonHeaderValue(500, "Internal Server Error")), this.dialog.bye(void 0, {
                        extraHeaders: t
                    }), this.stateTransition(m.Terminated);
                }
                this.delegate && this.delegate.onInvite && this.delegate.onInvite(e.message, n.message, 488);
            });
        });
    }
    onMessageRequest(e) {
        if (this.logger.log("Session.onMessageRequest"), this.state !== m.Established) {
            this.logger.error(`MESSAGE received while in state ${this.state}, dropping request`);
            return;
        }
        if (this.delegate && this.delegate.onMessage) {
            let t = new Me(e);
            this.delegate.onMessage(t);
        } else e.accept();
    }
    onNotifyRequest(e) {
        if (this.logger.log("Session.onNotifyRequest"), this.state !== m.Established) {
            this.logger.error(`NOTIFY received while in state ${this.state}, dropping request`);
            return;
        }
        if (this.onNotify) {
            let t = new Ce(e);
            this.onNotify(t);
            return;
        }
        if (this.delegate && this.delegate.onNotify) {
            let t = new Ce(e);
            this.delegate.onNotify(t);
        } else e.accept();
    }
    onPrackRequest(e) {
        if (this.logger.log("Session.onPrackRequest"), this.state !== m.Established) {
            this.logger.error(`PRACK received while in state ${this.state}, dropping request`);
            return;
        }
        throw new Error("Unimplemented.");
    }
    onReferRequest(e) {
        if (this.logger.log("Session.onReferRequest"), this.state !== m.Established) {
            this.logger.error(`REFER received while in state ${this.state}, dropping request`);
            return;
        }
        if (!e.message.hasHeader("refer-to")) {
            this.logger.warn("Invalid REFER packet. A refer-to header is required. Rejecting."), e.reject();
            return;
        }
        let t = new vt(e, this);
        this.delegate && this.delegate.onRefer ? this.delegate.onRefer(t) : (this.logger.log("No delegate available to handle REFER, automatically accepting and following."), t.accept().then(()=>t.makeInviter(this._referralInviterOptions).invite()
        ).catch((r)=>{
            this.logger.error(r.message);
        }));
    }
    generateResponseOfferAnswer(e, t) {
        if (this.dialog) return this.generateResponseOfferAnswerInDialog(t);
        let r = ue(e.message);
        return !r || r.contentDisposition !== "session" ? this.getOffer(t) : this.setOfferAndGetAnswer(r, t);
    }
    generateResponseOfferAnswerInDialog(e) {
        if (!this.dialog) throw new Error("Dialog undefined.");
        switch(this.dialog.signalingState){
            case T.Initial:
                return this.getOffer(e);
            case T.HaveLocalOffer:
                return Promise.resolve(void 0);
            case T.HaveRemoteOffer:
                if (!this.dialog.offer) throw new Error(`Session offer undefined in signaling state ${this.dialog.signalingState}.`);
                return this.setOfferAndGetAnswer(this.dialog.offer, e);
            case T.Stable:
                return this.state !== m.Established ? Promise.resolve(void 0) : this.getOffer(e);
            case T.Closed:
                throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
            default:
                throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
        }
    }
    getOffer(e) {
        let t = this.setupSessionDescriptionHandler(), r = e.sessionDescriptionHandlerOptions, s = e.sessionDescriptionHandlerModifiers;
        try {
            return t.getDescription(r, s).then((i)=>Se(i)
            ).catch((i)=>{
                this.logger.error("Session.getOffer: SDH getDescription rejected...");
                let n = i instanceof Error ? i : new Error("Session.getOffer unknown error.");
                throw this.logger.error(n.message), n;
            });
        } catch (i) {
            this.logger.error("Session.getOffer: SDH getDescription threw...");
            let n = i instanceof Error ? i : new Error(i);
            return this.logger.error(n.message), Promise.reject(n);
        }
    }
    rollbackOffer() {
        let e = this.setupSessionDescriptionHandler();
        if (e.rollbackDescription === void 0) return Promise.resolve();
        try {
            return e.rollbackDescription().catch((t)=>{
                this.logger.error("Session.rollbackOffer: SDH rollbackDescription rejected...");
                let r = t instanceof Error ? t : new Error("Session.rollbackOffer unknown error.");
                throw this.logger.error(r.message), r;
            });
        } catch (t) {
            this.logger.error("Session.rollbackOffer: SDH rollbackDescription threw...");
            let r = t instanceof Error ? t : new Error(t);
            return this.logger.error(r.message), Promise.reject(r);
        }
    }
    setAnswer(e, t) {
        let r = this.setupSessionDescriptionHandler(), s = t.sessionDescriptionHandlerOptions, i = t.sessionDescriptionHandlerModifiers;
        try {
            if (!r.hasDescription(e.contentType)) return Promise.reject(new $e);
        } catch (n1) {
            this.logger.error("Session.setAnswer: SDH hasDescription threw...");
            let a = n1 instanceof Error ? n1 : new Error(n1);
            return this.logger.error(a.message), Promise.reject(a);
        }
        try {
            return r.setDescription(e.content, s, i).catch((n)=>{
                this.logger.error("Session.setAnswer: SDH setDescription rejected...");
                let a = n instanceof Error ? n : new Error("Session.setAnswer unknown error.");
                throw this.logger.error(a.message), a;
            });
        } catch (n) {
            this.logger.error("Session.setAnswer: SDH setDescription threw...");
            let a = n instanceof Error ? n : new Error(n);
            return this.logger.error(a.message), Promise.reject(a);
        }
    }
    setOfferAndGetAnswer(e, t) {
        let r = this.setupSessionDescriptionHandler(), s = t.sessionDescriptionHandlerOptions, i = t.sessionDescriptionHandlerModifiers;
        try {
            if (!r.hasDescription(e.contentType)) return Promise.reject(new $e);
        } catch (n2) {
            this.logger.error("Session.setOfferAndGetAnswer: SDH hasDescription threw...");
            let a = n2 instanceof Error ? n2 : new Error(n2);
            return this.logger.error(a.message), Promise.reject(a);
        }
        try {
            return r.setDescription(e.content, s, i).then(()=>r.getDescription(s, i)
            ).then((n)=>Se(n)
            ).catch((n)=>{
                this.logger.error("Session.setOfferAndGetAnswer: SDH setDescription or getDescription rejected...");
                let a = n instanceof Error ? n : new Error("Session.setOfferAndGetAnswer unknown error.");
                throw this.logger.error(a.message), a;
            });
        } catch (n) {
            this.logger.error("Session.setOfferAndGetAnswer: SDH setDescription or getDescription threw...");
            let a = n instanceof Error ? n : new Error(n);
            return this.logger.error(a.message), Promise.reject(a);
        }
    }
    setSessionDescriptionHandler(e) {
        if (this._sessionDescriptionHandler) throw new Error("Session description handler defined.");
        this._sessionDescriptionHandler = e;
    }
    setupSessionDescriptionHandler() {
        var e;
        return this._sessionDescriptionHandler ? this._sessionDescriptionHandler : (this._sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(this, this.userAgent.configuration.sessionDescriptionHandlerFactoryOptions), ((e = this.delegate) === null || e === void 0 ? void 0 : e.onSessionDescriptionHandler) && this.delegate.onSessionDescriptionHandler(this._sessionDescriptionHandler, !1), this._sessionDescriptionHandler);
    }
    stateTransition(e) {
        let t = ()=>{
            throw new Error(`Invalid state transition from ${this._state} to ${e}`);
        };
        switch(this._state){
            case m.Initial:
                e !== m.Establishing && e !== m.Established && e !== m.Terminating && e !== m.Terminated && t();
                break;
            case m.Establishing:
                e !== m.Established && e !== m.Terminating && e !== m.Terminated && t();
                break;
            case m.Established:
                e !== m.Terminating && e !== m.Terminated && t();
                break;
            case m.Terminating:
                e !== m.Terminated && t();
                break;
            case m.Terminated:
                t();
                break;
            default:
                throw new Error("Unrecognized state.");
        }
        this._state = e, this.logger.log(`Session ${this.id} transitioned to state ${this._state}`), this._stateEventEmitter.emit(this._state), e === m.Terminated && this.dispose();
    }
    copyRequestOptions(e = {}) {
        let t = e.extraHeaders ? e.extraHeaders.slice() : void 0, r = e.body ? {
            contentDisposition: e.body.contentDisposition || "render",
            contentType: e.body.contentType || "text/plain",
            content: e.body.content || ""
        } : void 0;
        return {
            extraHeaders: t,
            body: r
        };
    }
    getReasonHeaderValue(e, t) {
        let r = e, s = de(e);
        return !s && t && (s = t), "SIP;cause=" + r + ';text="' + s + '"';
    }
    referExtraHeaders(e) {
        let t = [];
        return t.push("Referred-By: <" + this.userAgent.configuration.uri + ">"), t.push("Contact: " + this._contact), t.push("Allow: " + [
            "ACK",
            "CANCEL",
            "INVITE",
            "MESSAGE",
            "BYE",
            "OPTIONS",
            "INFO",
            "NOTIFY",
            "REFER"
        ].toString()), t.push("Refer-To: " + e), t;
    }
    referToString(e) {
        let t;
        if (e instanceof B) t = e.toString();
        else {
            if (!e.dialog) throw new Error("Dialog undefined.");
            let r = e.remoteIdentity.friendlyName, s = e.dialog.remoteTarget.toString(), i = e.dialog.callId, n = e.dialog.remoteTag, a = e.dialog.localTag, g = encodeURIComponent(`${i};to-tag=${n};from-tag=${a}`);
            t = `"${r}" <${s}?Replaces=${g}>`;
        }
        return t;
    }
};
var W;
(function(o) {
    o.Required = "Required", o.Supported = "Supported", o.Unsupported = "Unsupported";
})(W || (W = {}));
var Ht = {
    "100rel": !0,
    "199": !0,
    answermode: !0,
    "early-session": !0,
    eventlist: !0,
    explicitsub: !0,
    "from-change": !0,
    "geolocation-http": !0,
    "geolocation-sip": !0,
    gin: !0,
    gruu: !0,
    histinfo: !0,
    ice: !0,
    join: !0,
    "multiple-refer": !0,
    norefersub: !0,
    nosub: !0,
    outbound: !0,
    path: !0,
    policy: !0,
    precondition: !0,
    pref: !0,
    privacy: !0,
    "recipient-list-invite": !0,
    "recipient-list-message": !0,
    "recipient-list-subscribe": !0,
    replaces: !0,
    "resource-priority": !0,
    "sdp-anat": !0,
    "sec-agree": !0,
    tdialog: !0,
    timer: !0,
    uui: !0
};
var me = class extends ye {
    constructor(e, t){
        super(e);
        this.incomingInviteRequest = t, this.disposed = !1, this.expiresTimer = void 0, this.isCanceled = !1, this.rel100 = "none", this.rseq = Math.floor(Math.random() * 10000), this.userNoAnswerTimer = void 0, this.waitingForPrack = !1, this.logger = e.getLogger("sip.Invitation");
        let r = this.incomingInviteRequest.message, s = r.getHeader("require");
        s && s.toLowerCase().includes("100rel") && (this.rel100 = "required");
        let i = r.getHeader("supported");
        if (i && i.toLowerCase().includes("100rel") && (this.rel100 = "supported"), r.toTag = t.toTag, typeof r.toTag != "string") throw new TypeError("toTag should have been a string.");
        if (this.userNoAnswerTimer = setTimeout(()=>{
            t.reject({
                statusCode: 480
            }), this.stateTransition(m.Terminated);
        }, this.userAgent.configuration.noAnswerTimeout ? this.userAgent.configuration.noAnswerTimeout * 1000 : 60000), r.hasHeader("expires")) {
            let g = Number(r.getHeader("expires") || 0) * 1000;
            this.expiresTimer = setTimeout(()=>{
                this.state === m.Initial && (t.reject({
                    statusCode: 487
                }), this.stateTransition(m.Terminated));
            }, g);
        }
        let n = this.request.getHeader("P-Asserted-Identity");
        n && (this._assertedIdentity = R.nameAddrHeaderParse(n)), this._contact = this.userAgent.contact.toString();
        let a = r.parseHeader("Content-Disposition");
        a && a.type === "render" && (this._renderbody = r.body, this._rendertype = r.getHeader("Content-Type")), this._id = r.callId + r.fromTag, this.userAgent._sessions[this._id] = this;
    }
    dispose() {
        if (this.disposed) return Promise.resolve();
        switch(this.disposed = !0, this.expiresTimer && (clearTimeout(this.expiresTimer), this.expiresTimer = void 0), this.userNoAnswerTimer && (clearTimeout(this.userNoAnswerTimer), this.userNoAnswerTimer = void 0), this.prackNeverArrived(), this.state){
            case m.Initial:
                return this.reject().then(()=>super.dispose()
                );
            case m.Establishing:
                return this.reject().then(()=>super.dispose()
                );
            case m.Established:
                return super.dispose();
            case m.Terminating:
                return super.dispose();
            case m.Terminated:
                return super.dispose();
            default:
                throw new Error("Unknown state.");
        }
    }
    get autoSendAnInitialProvisionalResponse() {
        return this.rel100 !== "required" && this.userAgent.configuration.sendInitialProvisionalResponse;
    }
    get body() {
        return this.incomingInviteRequest.message.body;
    }
    get localIdentity() {
        return this.request.to;
    }
    get remoteIdentity() {
        return this.request.from;
    }
    get request() {
        return this.incomingInviteRequest.message;
    }
    accept(e = {}) {
        if (this.logger.log("Invitation.accept"), this.state !== m.Initial) {
            let t = new Error(`Invalid session state ${this.state}`);
            return this.logger.error(t.message), Promise.reject(t);
        }
        return e.sessionDescriptionHandlerModifiers && (this.sessionDescriptionHandlerModifiers = e.sessionDescriptionHandlerModifiers), e.sessionDescriptionHandlerOptions && (this.sessionDescriptionHandlerOptions = e.sessionDescriptionHandlerOptions), this.stateTransition(m.Establishing), this.sendAccept(e).then(({ message: t , session: r  })=>{
            r.delegate = {
                onAck: (s)=>this.onAckRequest(s)
                ,
                onAckTimeout: ()=>this.onAckTimeout()
                ,
                onBye: (s)=>this.onByeRequest(s)
                ,
                onInfo: (s)=>this.onInfoRequest(s)
                ,
                onInvite: (s)=>this.onInviteRequest(s)
                ,
                onMessage: (s)=>this.onMessageRequest(s)
                ,
                onNotify: (s)=>this.onNotifyRequest(s)
                ,
                onPrack: (s)=>this.onPrackRequest(s)
                ,
                onRefer: (s)=>this.onReferRequest(s)
            }, this._dialog = r, this.stateTransition(m.Established), this._replacee && this._replacee._bye();
        }).catch((t)=>this.handleResponseError(t)
        );
    }
    progress(e = {}) {
        if (this.logger.log("Invitation.progress"), this.state !== m.Initial) {
            let r = new Error(`Invalid session state ${this.state}`);
            return this.logger.error(r.message), Promise.reject(r);
        }
        let t = e.statusCode || 180;
        if (t < 100 || t > 199) throw new TypeError("Invalid statusCode: " + t);
        return e.sessionDescriptionHandlerModifiers && (this.sessionDescriptionHandlerModifiers = e.sessionDescriptionHandlerModifiers), e.sessionDescriptionHandlerOptions && (this.sessionDescriptionHandlerOptions = e.sessionDescriptionHandlerOptions), this.waitingForPrack ? (this.logger.warn("Unexpected call for progress while waiting for prack, ignoring"), Promise.resolve()) : e.statusCode === 100 ? this.sendProgressTrying().then(()=>{}).catch((r)=>this.handleResponseError(r)
        ) : this.rel100 !== "required" && !(this.rel100 === "supported" && e.rel100) && !(this.rel100 === "supported" && this.userAgent.configuration.sipExtension100rel === W.Required) ? this.sendProgress(e).then(()=>{}).catch((r)=>this.handleResponseError(r)
        ) : this.sendProgressReliableWaitForPrack(e).then(()=>{}).catch((r)=>this.handleResponseError(r)
        );
    }
    reject(e = {}) {
        if (this.logger.log("Invitation.reject"), this.state !== m.Initial && this.state !== m.Establishing) {
            let n = new Error(`Invalid session state ${this.state}`);
            return this.logger.error(n.message), Promise.reject(n);
        }
        let t = e.statusCode || 480, r = e.reasonPhrase ? e.reasonPhrase : de(t), s = e.extraHeaders || [];
        if (t < 300 || t > 699) throw new TypeError("Invalid statusCode: " + t);
        let i = e.body ? Se(e.body) : void 0;
        return t < 400 ? this.incomingInviteRequest.redirect([], {
            statusCode: t,
            reasonPhrase: r,
            extraHeaders: s,
            body: i
        }) : this.incomingInviteRequest.reject({
            statusCode: t,
            reasonPhrase: r,
            extraHeaders: s,
            body: i
        }), this.stateTransition(m.Terminated), Promise.resolve();
    }
    _onCancel(e) {
        if (this.logger.log("Invitation._onCancel"), this.state !== m.Initial && this.state !== m.Establishing) {
            this.logger.error(`CANCEL received while in state ${this.state}, dropping request`);
            return;
        }
        this.isCanceled = !0, this.incomingInviteRequest.reject({
            statusCode: 487
        }), this.stateTransition(m.Terminated);
    }
    handlePrackOfferAnswer(e) {
        if (!this.dialog) throw new Error("Dialog undefined.");
        let t = ue(e.message);
        if (!t || t.contentDisposition !== "session") return Promise.resolve(void 0);
        let r = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
        };
        switch(this.dialog.signalingState){
            case T.Initial:
                throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
            case T.Stable:
                return this.setAnswer(t, r).then(()=>{});
            case T.HaveLocalOffer:
                throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
            case T.HaveRemoteOffer:
                return this.setOfferAndGetAnswer(t, r);
            case T.Closed:
                throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
            default:
                throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
        }
    }
    handleResponseError(e) {
        let t = 480;
        if (e instanceof Error ? this.logger.error(e.message) : this.logger.error(e), e instanceof $e ? (this.logger.error("A session description handler occurred while sending response (content type unsupported"), t = 415) : e instanceof ft ? this.logger.error("A session description handler occurred while sending response") : e instanceof Oe ? this.logger.error("Session ended before response could be formulated and sent (while waiting for PRACK)") : e instanceof z && this.logger.error("Session changed state before response could be formulated and sent"), this.state === m.Initial || this.state === m.Establishing) try {
            this.incomingInviteRequest.reject({
                statusCode: t
            }), this.stateTransition(m.Terminated);
        } catch (r) {
            throw this.logger.error("An error occurred attempting to reject the request while handling another error"), r;
        }
        if (this.isCanceled) {
            this.logger.warn("An error occurred while attempting to formulate and send a response to an incoming INVITE. However a CANCEL was received and processed while doing so which can (and often does) result in errors occurring as the session terminates in the meantime. Said error is being ignored.");
            return;
        }
        throw e;
    }
    onAckTimeout() {
        if (this.logger.log("Invitation.onAckTimeout"), !this.dialog) throw new Error("Dialog undefined.");
        this.logger.log("No ACK received for an extended period of time, terminating session"), this.dialog.bye(), this.stateTransition(m.Terminated);
    }
    sendAccept(e = {}) {
        let t = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
        }, r = e.extraHeaders || [];
        return this.waitingForPrack ? this.waitForArrivalOfPrack().then(()=>clearTimeout(this.userNoAnswerTimer)
        ).then(()=>this.generateResponseOfferAnswer(this.incomingInviteRequest, t)
        ).then((s)=>this.incomingInviteRequest.accept({
                statusCode: 200,
                body: s,
                extraHeaders: r
            })
        ) : (clearTimeout(this.userNoAnswerTimer), this.generateResponseOfferAnswer(this.incomingInviteRequest, t).then((s)=>this.incomingInviteRequest.accept({
                statusCode: 200,
                body: s,
                extraHeaders: r
            })
        ));
    }
    sendProgress(e = {}) {
        let t = e.statusCode || 180, r = e.reasonPhrase, s = (e.extraHeaders || []).slice(), i = e.body ? Se(e.body) : void 0;
        if (t === 183 && !i) return this.sendProgressWithSDP(e);
        try {
            let n = this.incomingInviteRequest.progress({
                statusCode: t,
                reasonPhrase: r,
                extraHeaders: s,
                body: i
            });
            return this._dialog = n.session, Promise.resolve(n);
        } catch (n) {
            return Promise.reject(n);
        }
    }
    sendProgressWithSDP(e = {}) {
        let t = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
        }, r = e.statusCode || 183, s = e.reasonPhrase, i = (e.extraHeaders || []).slice();
        return this.generateResponseOfferAnswer(this.incomingInviteRequest, t).then((n)=>this.incomingInviteRequest.progress({
                statusCode: r,
                reasonPhrase: s,
                extraHeaders: i,
                body: n
            })
        ).then((n)=>(this._dialog = n.session, n)
        );
    }
    sendProgressReliable(e = {}) {
        return e.extraHeaders = (e.extraHeaders || []).slice(), e.extraHeaders.push("Require: 100rel"), e.extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000)), this.sendProgressWithSDP(e);
    }
    sendProgressReliableWaitForPrack(e = {}) {
        let t = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
        }, r = e.statusCode || 183, s = e.reasonPhrase, i = (e.extraHeaders || []).slice();
        i.push("Require: 100rel"), i.push("RSeq: " + this.rseq++);
        let n;
        return new Promise((a, g)=>{
            this.waitingForPrack = !0, this.generateResponseOfferAnswer(this.incomingInviteRequest, t).then((w)=>(n = w, this.incomingInviteRequest.progress({
                    statusCode: r,
                    reasonPhrase: s,
                    extraHeaders: i,
                    body: n
                }))
            ).then((w)=>{
                this._dialog = w.session;
                let u, v;
                w.session.delegate = {
                    onPrack: (ce)=>{
                        u = ce, clearTimeout(H), clearTimeout(Ie), !!this.waitingForPrack && (this.waitingForPrack = !1, this.handlePrackOfferAnswer(u).then((p)=>{
                            try {
                                v = u.accept({
                                    statusCode: 200,
                                    body: p
                                }), this.prackArrived(), a({
                                    prackRequest: u,
                                    prackResponse: v,
                                    progressResponse: w
                                });
                            } catch (_) {
                                g(_);
                            }
                        }).catch((p)=>g(p)
                        ));
                    }
                };
                let H = setTimeout(()=>{
                    !this.waitingForPrack || (this.waitingForPrack = !1, this.logger.warn("No PRACK received, rejecting INVITE."), clearTimeout(Ie), this.reject({
                        statusCode: 504
                    }).then(()=>g(new Oe)
                    ).catch((ce)=>g(ce)
                    ));
                }, A.T1 * 64), S = ()=>{
                    try {
                        this.incomingInviteRequest.progress({
                            statusCode: r,
                            reasonPhrase: s,
                            extraHeaders: i,
                            body: n
                        });
                    } catch (ce) {
                        this.waitingForPrack = !1, g(ce);
                        return;
                    }
                    Ie = setTimeout(S, V *= 2);
                }, V = A.T1, Ie = setTimeout(S, V);
            }).catch((w)=>{
                this.waitingForPrack = !1, g(w);
            });
        });
    }
    sendProgressTrying() {
        try {
            let e = this.incomingInviteRequest.trying();
            return Promise.resolve(e);
        } catch (e) {
            return Promise.reject(e);
        }
    }
    waitForArrivalOfPrack() {
        if (this.waitingForPrackPromise) throw new Error("Already waiting for PRACK");
        return this.waitingForPrackPromise = new Promise((e, t)=>{
            this.waitingForPrackResolve = e, this.waitingForPrackReject = t;
        }), this.waitingForPrackPromise;
    }
    prackArrived() {
        this.waitingForPrackResolve && this.waitingForPrackResolve(), this.waitingForPrackPromise = void 0, this.waitingForPrackResolve = void 0, this.waitingForPrackReject = void 0;
    }
    prackNeverArrived() {
        this.waitingForPrackReject && this.waitingForPrackReject(new Oe), this.waitingForPrackPromise = void 0, this.waitingForPrackResolve = void 0, this.waitingForPrackReject = void 0;
    }
};
var Ee = class extends ye {
    constructor(e, t, r = {}){
        super(e, r);
        this.disposed = !1, this.earlyMedia = !1, this.earlyMediaSessionDescriptionHandlers = new Map, this.isCanceled = !1, this.inviteWithoutSdp = !1, this.logger = e.getLogger("sip.Inviter"), this.earlyMedia = r.earlyMedia !== void 0 ? r.earlyMedia : this.earlyMedia, this.fromTag = he(), this.inviteWithoutSdp = r.inviteWithoutSdp !== void 0 ? r.inviteWithoutSdp : this.inviteWithoutSdp;
        let s = Object.assign({}, r);
        s.params = Object.assign({}, r.params);
        let i = r.anonymous || !1, n = e.contact.toString({
            anonymous: i,
            outbound: i ? !e.contact.tempGruu : !e.contact.pubGruu
        });
        i && e.configuration.uri && (s.params.fromDisplayName = "Anonymous", s.params.fromUri = "sip:anonymous@anonymous.invalid");
        let a = e.userAgentCore.configuration.aor;
        if (s.params.fromUri && (a = typeof s.params.fromUri == "string" ? R.URIParse(s.params.fromUri) : s.params.fromUri), !a) throw new TypeError("Invalid from URI: " + s.params.fromUri);
        let g = t;
        if (s.params.toUri && (g = typeof s.params.toUri == "string" ? R.URIParse(s.params.toUri) : s.params.toUri), !g) throw new TypeError("Invalid to URI: " + s.params.toUri);
        let w = Object.assign({}, s.params);
        w.fromTag = this.fromTag;
        let u = (s.extraHeaders || []).slice();
        i && e.configuration.uri && (u.push("P-Preferred-Identity: " + e.configuration.uri.toString()), u.push("Privacy: id")), u.push("Contact: " + n), u.push("Allow: " + [
            "ACK",
            "CANCEL",
            "INVITE",
            "MESSAGE",
            "BYE",
            "OPTIONS",
            "INFO",
            "NOTIFY",
            "REFER"
        ].toString()), e.configuration.sipExtension100rel === W.Required && u.push("Require: 100rel"), e.configuration.sipExtensionReplaces === W.Required && u.push("Require: replaces"), s.extraHeaders = u;
        let v = void 0;
        this.outgoingRequestMessage = e.userAgentCore.makeOutgoingRequestMessage(x.INVITE, t, a, g, w, u, v), this._contact = n, this._referralInviterOptions = s, this._renderbody = r.renderbody, this._rendertype = r.rendertype, r.sessionDescriptionHandlerModifiers && (this.sessionDescriptionHandlerModifiers = r.sessionDescriptionHandlerModifiers), r.sessionDescriptionHandlerOptions && (this.sessionDescriptionHandlerOptions = r.sessionDescriptionHandlerOptions), r.sessionDescriptionHandlerModifiersReInvite && (this.sessionDescriptionHandlerModifiersReInvite = r.sessionDescriptionHandlerModifiersReInvite), r.sessionDescriptionHandlerOptionsReInvite && (this.sessionDescriptionHandlerOptionsReInvite = r.sessionDescriptionHandlerOptionsReInvite), this._id = this.outgoingRequestMessage.callId + this.fromTag, this.userAgent._sessions[this._id] = this;
    }
    dispose() {
        if (this.disposed) return Promise.resolve();
        switch(this.disposed = !0, this.disposeEarlyMedia(), this.state){
            case m.Initial:
                return this.cancel().then(()=>super.dispose()
                );
            case m.Establishing:
                return this.cancel().then(()=>super.dispose()
                );
            case m.Established:
                return super.dispose();
            case m.Terminating:
                return super.dispose();
            case m.Terminated:
                return super.dispose();
            default:
                throw new Error("Unknown state.");
        }
    }
    get body() {
        return this.outgoingRequestMessage.body;
    }
    get localIdentity() {
        return this.outgoingRequestMessage.from;
    }
    get remoteIdentity() {
        return this.outgoingRequestMessage.to;
    }
    get request() {
        return this.outgoingRequestMessage;
    }
    cancel(e = {}) {
        if (this.logger.log("Inviter.cancel"), this.state !== m.Initial && this.state !== m.Establishing) {
            let r = new Error(`Invalid session state ${this.state}`);
            return this.logger.error(r.message), Promise.reject(r);
        }
        this.isCanceled = !0, this.stateTransition(m.Terminating);
        function t(r, s) {
            if (r && r < 200 || r > 699) throw new TypeError("Invalid statusCode: " + r);
            if (r) {
                let i = r, n = de(r) || s;
                return "SIP;cause=" + i + ';text="' + n + '"';
            }
        }
        if (this.outgoingInviteRequest) {
            let r;
            e.statusCode && e.reasonPhrase && (r = t(e.statusCode, e.reasonPhrase)), this.outgoingInviteRequest.cancel(r, e);
        } else this.logger.warn("Canceled session before INVITE was sent"), this.stateTransition(m.Terminated);
        return Promise.resolve();
    }
    invite(e = {}) {
        if (this.logger.log("Inviter.invite"), this.state !== m.Initial) return super.invite(e);
        if (e.sessionDescriptionHandlerModifiers && (this.sessionDescriptionHandlerModifiers = e.sessionDescriptionHandlerModifiers), e.sessionDescriptionHandlerOptions && (this.sessionDescriptionHandlerOptions = e.sessionDescriptionHandlerOptions), e.withoutSdp || this.inviteWithoutSdp) return this._renderbody && this._rendertype && (this.outgoingRequestMessage.body = {
            contentType: this._rendertype,
            body: this._renderbody
        }), this.stateTransition(m.Establishing), Promise.resolve(this.sendInvite(e));
        let t = {
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers,
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions
        };
        return this.getOffer(t).then((r)=>(this.outgoingRequestMessage.body = {
                body: r.content,
                contentType: r.contentType
            }, this.stateTransition(m.Establishing), this.sendInvite(e))
        ).catch((r)=>{
            throw this.logger.log(r.message), this.stateTransition(m.Terminated), r;
        });
    }
    sendInvite(e = {}) {
        return this.outgoingInviteRequest = this.userAgent.userAgentCore.invite(this.outgoingRequestMessage, {
            onAccept: (t)=>{
                if (this.dialog) {
                    this.logger.log("Additional confirmed dialog, sending ACK and BYE"), this.ackAndBye(t);
                    return;
                }
                if (this.isCanceled) {
                    this.logger.log("Canceled session accepted, sending ACK and BYE"), this.ackAndBye(t), this.stateTransition(m.Terminated);
                    return;
                }
                this.notifyReferer(t), this.onAccept(t).then(()=>{
                    this.disposeEarlyMedia();
                }).catch(()=>{
                    this.disposeEarlyMedia();
                }).then(()=>{
                    e.requestDelegate && e.requestDelegate.onAccept && e.requestDelegate.onAccept(t);
                });
            },
            onProgress: (t)=>{
                this.isCanceled || (this.notifyReferer(t), this.onProgress(t).catch(()=>{
                    this.disposeEarlyMedia();
                }).then(()=>{
                    e.requestDelegate && e.requestDelegate.onProgress && e.requestDelegate.onProgress(t);
                }));
            },
            onRedirect: (t)=>{
                this.notifyReferer(t), this.onRedirect(t), e.requestDelegate && e.requestDelegate.onRedirect && e.requestDelegate.onRedirect(t);
            },
            onReject: (t)=>{
                this.notifyReferer(t), this.onReject(t), e.requestDelegate && e.requestDelegate.onReject && e.requestDelegate.onReject(t);
            },
            onTrying: (t)=>{
                this.notifyReferer(t), this.onTrying(t), e.requestDelegate && e.requestDelegate.onTrying && e.requestDelegate.onTrying(t);
            }
        }), this.outgoingInviteRequest;
    }
    disposeEarlyMedia() {
        this.earlyMediaSessionDescriptionHandlers.forEach((e)=>{
            e.close();
        }), this.earlyMediaSessionDescriptionHandlers.clear();
    }
    notifyReferer(e) {
        if (!this._referred) return;
        if (!(this._referred instanceof ye)) throw new Error("Referred session not instance of session");
        if (!this._referred.dialog) return;
        if (!e.message.statusCode) throw new Error("Status code undefined.");
        if (!e.message.reasonPhrase) throw new Error("Reason phrase undefined.");
        let t = e.message.statusCode, r = e.message.reasonPhrase, s = `SIP/2.0 ${t} ${r}`.trim(), i = this._referred.dialog.notify(void 0, {
            extraHeaders: [
                "Event: refer",
                "Subscription-State: terminated"
            ],
            body: {
                contentDisposition: "render",
                contentType: "message/sipfrag",
                content: s
            }
        });
        i.delegate = {
            onReject: ()=>{
                this._referred = void 0;
            }
        };
    }
    onAccept(e) {
        if (this.logger.log("Inviter.onAccept"), this.state !== m.Establishing) return this.logger.error(`Accept received while in state ${this.state}, dropping response`), Promise.reject(new Error(`Invalid session state ${this.state}`));
        let t = e.message, r = e.session;
        switch(t.hasHeader("P-Asserted-Identity") && (this._assertedIdentity = R.nameAddrHeaderParse(t.getHeader("P-Asserted-Identity"))), r.delegate = {
            onAck: (s)=>this.onAckRequest(s)
            ,
            onBye: (s)=>this.onByeRequest(s)
            ,
            onInfo: (s)=>this.onInfoRequest(s)
            ,
            onInvite: (s)=>this.onInviteRequest(s)
            ,
            onMessage: (s)=>this.onMessageRequest(s)
            ,
            onNotify: (s)=>this.onNotifyRequest(s)
            ,
            onPrack: (s)=>this.onPrackRequest(s)
            ,
            onRefer: (s)=>this.onReferRequest(s)
        }, this._dialog = r, r.signalingState){
            case T.Initial:
                return this.logger.error("Received 2xx response to INVITE without a session description"), this.ackAndBye(e, 400, "Missing session description"), this.stateTransition(m.Terminated), Promise.reject(new Error("Bad Media Description"));
            case T.HaveLocalOffer:
                return this.logger.error("Received 2xx response to INVITE without a session description"), this.ackAndBye(e, 400, "Missing session description"), this.stateTransition(m.Terminated), Promise.reject(new Error("Bad Media Description"));
            case T.HaveRemoteOffer:
                {
                    if (!this._dialog.offer) throw new Error(`Session offer undefined in signaling state ${this._dialog.signalingState}.`);
                    let s = {
                        sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers,
                        sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions
                    };
                    return this.setOfferAndGetAnswer(this._dialog.offer, s).then((i)=>{
                        e.ack({
                            body: i
                        }), this.stateTransition(m.Established);
                    }).catch((i)=>{
                        throw this.ackAndBye(e, 488, "Invalid session description"), this.stateTransition(m.Terminated), i;
                    });
                }
            case T.Stable:
                {
                    if (this.earlyMediaSessionDescriptionHandlers.size > 0) {
                        let n = this.earlyMediaSessionDescriptionHandlers.get(r.id);
                        if (!n) throw new Error("Session description handler undefined.");
                        return this.setSessionDescriptionHandler(n), this.earlyMediaSessionDescriptionHandlers.delete(r.id), e.ack(), this.stateTransition(m.Established), Promise.resolve();
                    }
                    if (this.earlyMediaDialog) {
                        if (this.earlyMediaDialog !== r) {
                            if (this.earlyMedia) {
                                let a = "You have set the 'earlyMedia' option to 'true' which requires that your INVITE requests do not fork and yet this INVITE request did in fact fork. Consequentially and not surprisingly the end point which accepted the INVITE (confirmed dialog) does not match the end point with which early media has been setup (early dialog) and thus this session is unable to proceed. In accordance with the SIP specifications, the SIP servers your end point is connected to determine if an INVITE forks and the forking behavior of those servers cannot be controlled by this library. If you wish to use early media with this library you must configure those servers accordingly. Alternatively you may set the 'earlyMedia' to 'false' which will allow this library to function with any INVITE requests which do fork.";
                                this.logger.error(a);
                            }
                            let n = new Error("Early media dialog does not equal confirmed dialog, terminating session");
                            return this.logger.error(n.message), this.ackAndBye(e, 488, "Not Acceptable Here"), this.stateTransition(m.Terminated), Promise.reject(n);
                        }
                        return e.ack(), this.stateTransition(m.Established), Promise.resolve();
                    }
                    let s = r.answer;
                    if (!s) throw new Error("Answer is undefined.");
                    let i = {
                        sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers,
                        sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions
                    };
                    return this.setAnswer(s, i).then(()=>{
                        let n;
                        this._renderbody && this._rendertype && (n = {
                            body: {
                                contentDisposition: "render",
                                contentType: this._rendertype,
                                content: this._renderbody
                            }
                        }), e.ack(n), this.stateTransition(m.Established);
                    }).catch((n)=>{
                        throw this.logger.error(n.message), this.ackAndBye(e, 488, "Not Acceptable Here"), this.stateTransition(m.Terminated), n;
                    });
                }
            case T.Closed:
                return Promise.reject(new Error("Terminated."));
            default:
                throw new Error("Unknown session signaling state.");
        }
    }
    onProgress(e) {
        var t;
        if (this.logger.log("Inviter.onProgress"), this.state !== m.Establishing) return this.logger.error(`Progress received while in state ${this.state}, dropping response`), Promise.reject(new Error(`Invalid session state ${this.state}`));
        if (!this.outgoingInviteRequest) throw new Error("Outgoing INVITE request undefined.");
        let r = e.message, s = e.session;
        r.hasHeader("P-Asserted-Identity") && (this._assertedIdentity = R.nameAddrHeaderParse(r.getHeader("P-Asserted-Identity")));
        let i = r.getHeader("require"), n = r.getHeader("rseq"), g = !!(i && i.includes("100rel") && n ? Number(n) : void 0), w = [];
        switch(g && w.push("RAck: " + r.getHeader("rseq") + " " + r.getHeader("cseq")), s.signalingState){
            case T.Initial:
                return g && (this.logger.warn("First reliable provisional response received MUST contain an offer when INVITE does not contain an offer."), e.prack({
                    extraHeaders: w
                })), Promise.resolve();
            case T.HaveLocalOffer:
                return g && e.prack({
                    extraHeaders: w
                }), Promise.resolve();
            case T.HaveRemoteOffer:
                if (!g) return this.logger.warn("Non-reliable provisional response MUST NOT contain an initial offer, discarding response."), Promise.resolve();
                {
                    let u = this.sessionDescriptionHandlerFactory(this, this.userAgent.configuration.sessionDescriptionHandlerFactoryOptions || {});
                    return ((t = this.delegate) === null || t === void 0 ? void 0 : t.onSessionDescriptionHandler) && this.delegate.onSessionDescriptionHandler(u, !0), this.earlyMediaSessionDescriptionHandlers.set(s.id, u), u.setDescription(r.body, this.sessionDescriptionHandlerOptions, this.sessionDescriptionHandlerModifiers).then(()=>u.getDescription(this.sessionDescriptionHandlerOptions, this.sessionDescriptionHandlerModifiers)
                    ).then((v)=>{
                        let E = {
                            contentDisposition: "session",
                            contentType: v.contentType,
                            content: v.body
                        };
                        e.prack({
                            extraHeaders: w,
                            body: E
                        });
                    }).catch((v)=>{
                        throw this.stateTransition(m.Terminated), v;
                    });
                }
            case T.Stable:
                if (g && e.prack({
                    extraHeaders: w
                }), this.earlyMedia && !this.earlyMediaDialog) {
                    this.earlyMediaDialog = s;
                    let u = s.answer;
                    if (!u) throw new Error("Answer is undefined.");
                    let v = {
                        sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers,
                        sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions
                    };
                    return this.setAnswer(u, v).catch((E)=>{
                        throw this.stateTransition(m.Terminated), E;
                    });
                }
                return Promise.resolve();
            case T.Closed:
                return Promise.reject(new Error("Terminated."));
            default:
                throw new Error("Unknown session signaling state.");
        }
    }
    onRedirect(e) {
        if (this.logger.log("Inviter.onRedirect"), this.state !== m.Establishing && this.state !== m.Terminating) {
            this.logger.error(`Redirect received while in state ${this.state}, dropping response`);
            return;
        }
        this.stateTransition(m.Terminated);
    }
    onReject(e) {
        if (this.logger.log("Inviter.onReject"), this.state !== m.Establishing && this.state !== m.Terminating) {
            this.logger.error(`Reject received while in state ${this.state}, dropping response`);
            return;
        }
        this.stateTransition(m.Terminated);
    }
    onTrying(e) {
        if (this.logger.log("Inviter.onTrying"), this.state !== m.Establishing) {
            this.logger.error(`Trying received while in state ${this.state}, dropping response`);
            return;
        }
    }
};
var xt = class {
    constructor(e, t, r, s = "text/plain", i = {}){
        this.logger = e.getLogger("sip.Messager"), i.params = i.params || {};
        let n = e.userAgentCore.configuration.aor;
        if (i.params.fromUri && (n = typeof i.params.fromUri == "string" ? R.URIParse(i.params.fromUri) : i.params.fromUri), !n) throw new TypeError("Invalid from URI: " + i.params.fromUri);
        let a = t;
        if (i.params.toUri && (a = typeof i.params.toUri == "string" ? R.URIParse(i.params.toUri) : i.params.toUri), !a) throw new TypeError("Invalid to URI: " + i.params.toUri);
        let g = i.params ? Object.assign({}, i.params) : {}, w = (i.extraHeaders || []).slice(), v = {
            contentDisposition: "render",
            contentType: s,
            content: r
        };
        this.request = e.userAgentCore.makeOutgoingRequestMessage(x.MESSAGE, t, n, a, g, w, v), this.userAgent = e;
    }
    message(e = {}) {
        return this.userAgent.userAgentCore.request(this.request, e.requestDelegate), Promise.resolve();
    }
};
var y;
(function(o) {
    o.Initial = "Initial", o.Registered = "Registered", o.Unregistered = "Unregistered", o.Terminated = "Terminated";
})(y || (y = {}));
var Y = class {
    constructor(e, t = {}){
        this.disposed = !1, this._contacts = [], this._retryAfter = void 0, this._state = y.Initial, this._waiting = !1, this._stateEventEmitter = new ne, this._waitingEventEmitter = new ne, this.userAgent = e;
        let r = e.configuration.uri.clone();
        if (r.user = void 0, this.options = Object.assign(Object.assign(Object.assign({}, Y.defaultOptions()), {
            registrar: r
        }), Y.stripUndefinedProperties(t)), this.options.extraContactHeaderParams = (this.options.extraContactHeaderParams || []).slice(), this.options.extraHeaders = (this.options.extraHeaders || []).slice(), !this.options.registrar) throw new Error("Registrar undefined.");
        if (this.options.registrar = this.options.registrar.clone(), this.options.regId && !this.options.instanceId ? this.options.instanceId = Y.newUUID() : !this.options.regId && this.options.instanceId && (this.options.regId = 1), this.options.instanceId && R.parse(this.options.instanceId, "uuid") === -1) throw new Error("Invalid instanceId.");
        if (this.options.regId && this.options.regId < 0) throw new Error("Invalid regId.");
        let s = this.options.registrar, i = this.options.params && this.options.params.fromUri || e.userAgentCore.configuration.aor, n = this.options.params && this.options.params.toUri || e.configuration.uri, a = this.options.params || {}, g = (t.extraHeaders || []).slice();
        if (this.request = e.userAgentCore.makeOutgoingRequestMessage(x.REGISTER, s, i, n, a, g, void 0), this.expires = this.options.expires || Y.defaultExpires, this.expires < 0) throw new Error("Invalid expires.");
        if (this.refreshFrequency = this.options.refreshFrequency || Y.defaultRefreshFrequency, this.refreshFrequency < 50 || this.refreshFrequency > 99) throw new Error("Invalid refresh frequency. The value represents a percentage of the expiration time and should be between 50 and 99.");
        this.logger = e.getLogger("sip.Registerer"), this.options.logConfiguration && (this.logger.log("Configuration:"), Object.keys(this.options).forEach((w)=>{
            let u = this.options[w];
            switch(w){
                case "registrar":
                    this.logger.log("\xB7 " + w + ": " + u);
                    break;
                default:
                    this.logger.log("\xB7 " + w + ": " + JSON.stringify(u));
            }
        })), this.id = this.request.callId + this.request.from.parameters.tag, this.userAgent._registerers[this.id] = this;
    }
    static defaultOptions() {
        return {
            expires: Y.defaultExpires,
            extraContactHeaderParams: [],
            extraHeaders: [],
            logConfiguration: !0,
            instanceId: "",
            params: {},
            regId: 0,
            registrar: new B("sip", "anonymous", "anonymous.invalid"),
            refreshFrequency: Y.defaultRefreshFrequency
        };
    }
    static newUUID() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (t)=>{
            let r = Math.floor(Math.random() * 16);
            return (t === "x" ? r : r % 4 + 8).toString(16);
        });
    }
    static stripUndefinedProperties(e) {
        return Object.keys(e).reduce((t, r)=>(e[r] !== void 0 && (t[r] = e[r]), t)
        , {});
    }
    get contacts() {
        return this._contacts.slice();
    }
    get retryAfter() {
        return this._retryAfter;
    }
    get state() {
        return this._state;
    }
    get stateChange() {
        return this._stateEventEmitter;
    }
    dispose() {
        return this.disposed ? Promise.resolve() : (this.disposed = !0, this.logger.log(`Registerer ${this.id} in state ${this.state} is being disposed`), delete this.userAgent._registerers[this.id], new Promise((e)=>{
            let t = ()=>{
                if (!this.waiting && this._state === y.Registered) {
                    this.stateChange.addListener(()=>{
                        this.terminated(), e();
                    }, {
                        once: !0
                    }), this.unregister();
                    return;
                }
                this.terminated(), e();
            };
            this.waiting ? this.waitingChange.addListener(()=>{
                t();
            }, {
                once: !0
            }) : t();
        }));
    }
    register(e = {}) {
        if (this.state === y.Terminated) throw this.stateError(), new Error("Registerer terminated. Unable to register.");
        if (this.disposed) throw this.stateError(), new Error("Registerer disposed. Unable to register.");
        if (this.waiting) {
            this.waitingWarning();
            let s = new pe("REGISTER request already in progress, waiting for final response");
            return Promise.reject(s);
        }
        e.requestOptions && (this.options = Object.assign(Object.assign({}, this.options), e.requestOptions));
        let t = (this.options.extraHeaders || []).slice();
        t.push("Contact: " + this.generateContactHeader(this.expires)), t.push("Allow: " + [
            "ACK",
            "CANCEL",
            "INVITE",
            "MESSAGE",
            "BYE",
            "OPTIONS",
            "INFO",
            "NOTIFY",
            "REFER"
        ].toString()), this.request.cseq++, this.request.setHeader("cseq", this.request.cseq + " REGISTER"), this.request.extraHeaders = t, this.waitingToggle(!0);
        let r = this.userAgent.userAgentCore.register(this.request, {
            onAccept: (s)=>{
                let i;
                s.message.hasHeader("expires") && (i = Number(s.message.getHeader("expires"))), this._contacts = s.message.getHeaders("contact");
                let n = this._contacts.length;
                if (!n) {
                    this.logger.error("No Contact header in response to REGISTER, dropping response."), this.unregistered();
                    return;
                }
                let a;
                for(; n--;){
                    if (a = s.message.parseHeader("contact", n), !a) throw new Error("Contact undefined");
                    if (this.userAgent.contact.pubGruu && Ve(a.uri, this.userAgent.contact.pubGruu)) {
                        i = Number(a.getParam("expires"));
                        break;
                    }
                    if (this.userAgent.configuration.contactName === "") {
                        if (a.uri.user === this.userAgent.contact.uri.user) {
                            i = Number(a.getParam("expires"));
                            break;
                        }
                    } else if (Ve(a.uri, this.userAgent.contact.uri)) {
                        i = Number(a.getParam("expires"));
                        break;
                    }
                    a = void 0;
                }
                if (a === void 0) {
                    this.logger.error("No Contact header pointing to us, dropping response"), this.unregistered(), this.waitingToggle(!1);
                    return;
                }
                if (i === void 0) {
                    this.logger.error("Contact pointing to us is missing expires parameter, dropping response"), this.unregistered(), this.waitingToggle(!1);
                    return;
                }
                if (a.hasParam("temp-gruu")) {
                    let g = a.getParam("temp-gruu");
                    g && (this.userAgent.contact.tempGruu = R.URIParse(g.replace(/"/g, "")));
                }
                if (a.hasParam("pub-gruu")) {
                    let g = a.getParam("pub-gruu");
                    g && (this.userAgent.contact.pubGruu = R.URIParse(g.replace(/"/g, "")));
                }
                this.registered(i), e.requestDelegate && e.requestDelegate.onAccept && e.requestDelegate.onAccept(s), this.waitingToggle(!1);
            },
            onProgress: (s)=>{
                e.requestDelegate && e.requestDelegate.onProgress && e.requestDelegate.onProgress(s);
            },
            onRedirect: (s)=>{
                this.logger.error("Redirect received. Not supported."), this.unregistered(), e.requestDelegate && e.requestDelegate.onRedirect && e.requestDelegate.onRedirect(s), this.waitingToggle(!1);
            },
            onReject: (s)=>{
                if (s.message.statusCode === 423) {
                    if (!s.message.hasHeader("min-expires")) {
                        this.logger.error("423 response received for REGISTER without Min-Expires, dropping response"), this.unregistered(), this.waitingToggle(!1);
                        return;
                    }
                    this.expires = Number(s.message.getHeader("min-expires")), this.waitingToggle(!1), this.register();
                    return;
                }
                this.logger.warn(`Failed to register, status code ${s.message.statusCode}`);
                let i = NaN;
                if (s.message.statusCode === 500 || s.message.statusCode === 503) {
                    let n = s.message.getHeader("retry-after");
                    n && (i = Number.parseInt(n, void 0));
                }
                this._retryAfter = isNaN(i) ? void 0 : i, this.unregistered(), e.requestDelegate && e.requestDelegate.onReject && e.requestDelegate.onReject(s), this._retryAfter = void 0, this.waitingToggle(!1);
            },
            onTrying: (s)=>{
                e.requestDelegate && e.requestDelegate.onTrying && e.requestDelegate.onTrying(s);
            }
        });
        return Promise.resolve(r);
    }
    unregister(e = {}) {
        if (this.state === y.Terminated) throw this.stateError(), new Error("Registerer terminated. Unable to register.");
        if (this.disposed && this.state !== y.Registered) throw this.stateError(), new Error("Registerer disposed. Unable to register.");
        if (this.waiting) {
            this.waitingWarning();
            let s = new pe("REGISTER request already in progress, waiting for final response");
            return Promise.reject(s);
        }
        this._state !== y.Registered && !e.all && this.logger.warn("Not currently registered, but sending an unregister anyway.");
        let t = (e.requestOptions && e.requestOptions.extraHeaders || []).slice();
        this.request.extraHeaders = t, e.all ? (t.push("Contact: *"), t.push("Expires: 0")) : t.push("Contact: " + this.generateContactHeader(0)), this.request.cseq++, this.request.setHeader("cseq", this.request.cseq + " REGISTER"), this.registrationTimer !== void 0 && (clearTimeout(this.registrationTimer), this.registrationTimer = void 0), this.waitingToggle(!0);
        let r = this.userAgent.userAgentCore.register(this.request, {
            onAccept: (s)=>{
                this._contacts = s.message.getHeaders("contact"), this.unregistered(), e.requestDelegate && e.requestDelegate.onAccept && e.requestDelegate.onAccept(s), this.waitingToggle(!1);
            },
            onProgress: (s)=>{
                e.requestDelegate && e.requestDelegate.onProgress && e.requestDelegate.onProgress(s);
            },
            onRedirect: (s)=>{
                this.logger.error("Unregister redirected. Not currently supported."), this.unregistered(), e.requestDelegate && e.requestDelegate.onRedirect && e.requestDelegate.onRedirect(s), this.waitingToggle(!1);
            },
            onReject: (s)=>{
                this.logger.error(`Unregister rejected with status code ${s.message.statusCode}`), this.unregistered(), e.requestDelegate && e.requestDelegate.onReject && e.requestDelegate.onReject(s), this.waitingToggle(!1);
            },
            onTrying: (s)=>{
                e.requestDelegate && e.requestDelegate.onTrying && e.requestDelegate.onTrying(s);
            }
        });
        return Promise.resolve(r);
    }
    clearTimers() {
        this.registrationTimer !== void 0 && (clearTimeout(this.registrationTimer), this.registrationTimer = void 0), this.registrationExpiredTimer !== void 0 && (clearTimeout(this.registrationExpiredTimer), this.registrationExpiredTimer = void 0);
    }
    generateContactHeader(e) {
        let t = this.userAgent.contact.toString();
        return this.options.regId && this.options.instanceId && (t += ";reg-id=" + this.options.regId, t += ';+sip.instance="<urn:uuid:' + this.options.instanceId + '>"'), this.options.extraContactHeaderParams && this.options.extraContactHeaderParams.forEach((r)=>{
            t += ";" + r;
        }), t += ";expires=" + e, t;
    }
    registered(e) {
        this.clearTimers(), this.registrationTimer = setTimeout(()=>{
            this.registrationTimer = void 0, this.register();
        }, this.refreshFrequency / 100 * e * 1000), this.registrationExpiredTimer = setTimeout(()=>{
            this.logger.warn("Registration expired"), this.unregistered();
        }, e * 1000), this._state !== y.Registered && this.stateTransition(y.Registered);
    }
    unregistered() {
        this.clearTimers(), this._state !== y.Unregistered && this.stateTransition(y.Unregistered);
    }
    terminated() {
        this.clearTimers(), this._state !== y.Terminated && this.stateTransition(y.Terminated);
    }
    stateTransition(e) {
        let t = ()=>{
            throw new Error(`Invalid state transition from ${this._state} to ${e}`);
        };
        switch(this._state){
            case y.Initial:
                e !== y.Registered && e !== y.Unregistered && e !== y.Terminated && t();
                break;
            case y.Registered:
                e !== y.Unregistered && e !== y.Terminated && t();
                break;
            case y.Unregistered:
                e !== y.Registered && e !== y.Terminated && t();
                break;
            case y.Terminated:
                t();
                break;
            default:
                throw new Error("Unrecognized state.");
        }
        this._state = e, this.logger.log(`Registration transitioned to state ${this._state}`), this._stateEventEmitter.emit(this._state), e === y.Terminated && this.dispose();
    }
    get waiting() {
        return this._waiting;
    }
    get waitingChange() {
        return this._waitingEventEmitter;
    }
    waitingToggle(e) {
        if (this._waiting === e) throw new Error(`Invalid waiting transition from ${this._waiting} to ${e}`);
        this._waiting = e, this.logger.log(`Waiting toggled to ${this._waiting}`), this._waitingEventEmitter.emit(this._waiting);
    }
    waitingWarning() {
        let e = "An attempt was made to send a REGISTER request while a prior one was still in progress.";
        e += " RFC 3261 requires UAs MUST NOT send a new registration until they have received a final response", e += " from the registrar for the previous one or the previous REGISTER request has timed out.", e += " Note that if the transport disconnects, you still must wait for the prior request to time out before", e += " sending a new REGISTER request or alternatively dispose of the current Registerer and create a new Registerer.", this.logger.warn(e);
    }
    stateError() {
        let t = `An attempt was made to send a REGISTER request when the Registerer ${this.state === y.Terminated ? "is in 'Terminated' state" : "has been disposed"}.`;
        t += " The Registerer transitions to 'Terminated' when Registerer.dispose() is called.", t += " Perhaps you called UserAgent.stop() which dipsoses of all Registerers?", this.logger.error(t);
    }
};
Y.defaultExpires = 600;
Y.defaultRefreshFrequency = 99;
var b;
(function(o) {
    o.Connecting = "Connecting", o.Connected = "Connected", o.Disconnecting = "Disconnecting", o.Disconnected = "Disconnected";
})(b || (b = {}));
var U;
(function(o) {
    o.Started = "Started", o.Stopped = "Stopped";
})(U || (U = {}));
var we = class {
    constructor(e, t){
        if (this._state = b.Disconnected, this.transitioningState = !1, this._stateEventEmitter = new ne, this.logger = e, t) {
            let i = t, n = i == null ? void 0 : i.wsServers, a = i == null ? void 0 : i.maxReconnectionAttempts;
            if (n !== void 0) {
                let g = 'The transport option "wsServers" as has apparently been specified and has been deprecated. It will no longer be available starting with SIP.js release 0.16.0. Please update accordingly.';
                this.logger.warn(g);
            }
            if (a !== void 0) {
                let g = 'The transport option "maxReconnectionAttempts" as has apparently been specified and has been deprecated. It will no longer be available starting with SIP.js release 0.16.0. Please update accordingly.';
                this.logger.warn(g);
            }
            n && !t.server && (typeof n == "string" && (t.server = n), n instanceof Array && (t.server = n[0]));
        }
        this.configuration = Object.assign(Object.assign({}, we.defaultOptions), t);
        let r = this.configuration.server, s = R.parse(r, "absoluteURI");
        if (s === -1) throw this.logger.error(`Invalid WebSocket Server URL "${r}"`), new Error("Invalid WebSocket Server URL");
        if (![
            "wss",
            "ws",
            "udp"
        ].includes(s.scheme)) throw this.logger.error(`Invalid scheme in WebSocket Server URL "${r}"`), new Error("Invalid scheme in WebSocket Server URL");
        this._protocol = s.scheme.toUpperCase();
    }
    dispose() {
        return this.disconnect();
    }
    get protocol() {
        return this._protocol;
    }
    get server() {
        return this.configuration.server;
    }
    get state() {
        return this._state;
    }
    get stateChange() {
        return this._stateEventEmitter;
    }
    get ws() {
        return this._ws;
    }
    connect() {
        return this._connect();
    }
    disconnect() {
        return this._disconnect();
    }
    isConnected() {
        return this.state === b.Connected;
    }
    send(e) {
        return this._send(e);
    }
    _connect() {
        switch(this.logger.log(`Connecting ${this.server}`), this.state){
            case b.Connecting:
                if (this.transitioningState) return Promise.reject(this.transitionLoopDetectedError(b.Connecting));
                if (!this.connectPromise) throw new Error("Connect promise must be defined.");
                return this.connectPromise;
            case b.Connected:
                if (this.transitioningState) return Promise.reject(this.transitionLoopDetectedError(b.Connecting));
                if (this.connectPromise) throw new Error("Connect promise must not be defined.");
                return Promise.resolve();
            case b.Disconnecting:
                if (this.connectPromise) throw new Error("Connect promise must not be defined.");
                try {
                    this.transitionState(b.Connecting);
                } catch (t3) {
                    if (t3 instanceof Te) return Promise.reject(t3);
                    throw t3;
                }
                break;
            case b.Disconnected:
                if (this.connectPromise) throw new Error("Connect promise must not be defined.");
                try {
                    this.transitionState(b.Connecting);
                } catch (t2) {
                    if (t2 instanceof Te) return Promise.reject(t2);
                    throw t2;
                }
                break;
            default:
                throw new Error("Unknown state");
        }
        let e;
        try {
            e = new WebSocket(this.server, "sip"), e.binaryType = "arraybuffer", e.addEventListener("close", (t)=>this.onWebSocketClose(t, e)
            ), e.addEventListener("error", (t)=>this.onWebSocketError(t, e)
            ), e.addEventListener("open", (t)=>this.onWebSocketOpen(t, e)
            ), e.addEventListener("message", (t)=>this.onWebSocketMessage(t, e)
            ), this._ws = e;
        } catch (t4) {
            return this._ws = void 0, this.logger.error("WebSocket construction failed."), this.logger.error(t4), new Promise((r, s)=>{
                this.connectResolve = r, this.connectReject = s, this.transitionState(b.Disconnected, t4);
            });
        }
        return this.connectPromise = new Promise((t, r)=>{
            this.connectResolve = t, this.connectReject = r, this.connectTimeout = setTimeout(()=>{
                this.logger.warn("Connect timed out. Exceeded time set in configuration.connectionTimeout: " + this.configuration.connectionTimeout + "s."), e.close(1000);
            }, this.configuration.connectionTimeout * 1000);
        }), this.connectPromise;
    }
    _disconnect() {
        switch(this.logger.log(`Disconnecting ${this.server}`), this.state){
            case b.Connecting:
                if (this.disconnectPromise) throw new Error("Disconnect promise must not be defined.");
                try {
                    this.transitionState(b.Disconnecting);
                } catch (t6) {
                    if (t6 instanceof Te) return Promise.reject(t6);
                    throw t6;
                }
                break;
            case b.Connected:
                if (this.disconnectPromise) throw new Error("Disconnect promise must not be defined.");
                try {
                    this.transitionState(b.Disconnecting);
                } catch (t5) {
                    if (t5 instanceof Te) return Promise.reject(t5);
                    throw t5;
                }
                break;
            case b.Disconnecting:
                if (this.transitioningState) return Promise.reject(this.transitionLoopDetectedError(b.Disconnecting));
                if (!this.disconnectPromise) throw new Error("Disconnect promise must be defined.");
                return this.disconnectPromise;
            case b.Disconnected:
                if (this.transitioningState) return Promise.reject(this.transitionLoopDetectedError(b.Disconnecting));
                if (this.disconnectPromise) throw new Error("Disconnect promise must not be defined.");
                return Promise.resolve();
            default:
                throw new Error("Unknown state");
        }
        if (!this._ws) throw new Error("WebSocket must be defined.");
        let e = this._ws;
        return this.disconnectPromise = new Promise((t, r)=>{
            this.disconnectResolve = t, this.disconnectReject = r;
            try {
                e.close(1000);
            } catch (s) {
                throw this.logger.error("WebSocket close failed."), this.logger.error(s), s;
            }
        }), this.disconnectPromise;
    }
    _send(e) {
        if (this.configuration.traceSip === !0 && this.logger.log(`Sending WebSocket message:

` + e + `
`), this._state !== b.Connected) return Promise.reject(new Error("Not connected."));
        if (!this._ws) throw new Error("WebSocket undefined.");
        try {
            this._ws.send(e);
        } catch (t) {
            return t instanceof Error ? Promise.reject(t) : Promise.reject(new Error("WebSocket send failed."));
        }
        return Promise.resolve();
    }
    onWebSocketClose(e, t) {
        if (t !== this._ws) return;
        let r = `WebSocket closed ${this.server} (code: ${e.code})`, s = this.disconnectPromise ? void 0 : new Error(r);
        s && this.logger.warn("WebSocket closed unexpectedly"), this.logger.log(r), this._ws = void 0, this.transitionState(b.Disconnected, s);
    }
    onWebSocketError(e, t) {
        t === this._ws && this.logger.error("WebSocket error occurred.");
    }
    onWebSocketMessage(e, t) {
        if (t !== this._ws) return;
        let r = e.data, s;
        if (/^(\r\n)+$/.test(r)) {
            this.clearKeepAliveTimeout(), this.configuration.traceSip === !0 && this.logger.log("Received WebSocket message with CRLF Keep Alive response");
            return;
        }
        if (!r) {
            this.logger.warn("Received empty message, discarding...");
            return;
        }
        if (typeof r != "string") {
            try {
                s = new TextDecoder().decode(new Uint8Array(r));
            } catch (i) {
                this.logger.error(i), this.logger.error("Received WebSocket binary message failed to be converted into string, message discarded");
                return;
            }
            this.configuration.traceSip === !0 && this.logger.log(`Received WebSocket binary message:

` + s + `
`);
        } else s = r, this.configuration.traceSip === !0 && this.logger.log(`Received WebSocket text message:

` + s + `
`);
        if (this.state !== b.Connected) {
            this.logger.warn("Received message while not connected, discarding...");
            return;
        }
        if (this.onMessage) try {
            this.onMessage(s);
        } catch (i) {
            throw this.logger.error(i), this.logger.error("Exception thrown by onMessage callback"), i;
        }
    }
    onWebSocketOpen(e, t) {
        t === this._ws && this._state === b.Connecting && (this.logger.log(`WebSocket opened ${this.server}`), this.transitionState(b.Connected));
    }
    transitionLoopDetectedError(e) {
        let t = "A state transition loop has been detected.";
        return t += ` An attempt to transition from ${this._state} to ${e} before the prior transition completed.`, t += " Perhaps you are synchronously calling connect() or disconnect() from a callback or state change handler?", this.logger.error(t), new Te("Loop detected.");
    }
    transitionState(e, t) {
        let r = ()=>{
            throw new Error(`Invalid state transition from ${this._state} to ${e}`);
        };
        if (this.transitioningState) throw this.transitionLoopDetectedError(e);
        switch(this.transitioningState = !0, this._state){
            case b.Connecting:
                e !== b.Connected && e !== b.Disconnecting && e !== b.Disconnected && r();
                break;
            case b.Connected:
                e !== b.Disconnecting && e !== b.Disconnected && r();
                break;
            case b.Disconnecting:
                e !== b.Connecting && e !== b.Disconnected && r();
                break;
            case b.Disconnected:
                e !== b.Connecting && r();
                break;
            default:
                throw new Error("Unknown state.");
        }
        let s = this._state;
        this._state = e;
        let i = this.connectResolve, n = this.connectReject;
        s === b.Connecting && (this.connectPromise = void 0, this.connectResolve = void 0, this.connectReject = void 0);
        let a = this.disconnectResolve, g = this.disconnectReject;
        if (s === b.Disconnecting && (this.disconnectPromise = void 0, this.disconnectResolve = void 0, this.disconnectReject = void 0), this.connectTimeout && (clearTimeout(this.connectTimeout), this.connectTimeout = void 0), this.logger.log(`Transitioned from ${s} to ${this._state}`), this._stateEventEmitter.emit(this._state), e === b.Connected && (this.startSendingKeepAlives(), this.onConnect)) try {
            this.onConnect();
        } catch (w) {
            throw this.logger.error(w), this.logger.error("Exception thrown by onConnect callback"), w;
        }
        if (s === b.Connected && (this.stopSendingKeepAlives(), this.onDisconnect)) try {
            t ? this.onDisconnect(t) : this.onDisconnect();
        } catch (w1) {
            throw this.logger.error(w1), this.logger.error("Exception thrown by onDisconnect callback"), w1;
        }
        if (s === b.Connecting) {
            if (!i) throw new Error("Connect resolve undefined.");
            if (!n) throw new Error("Connect reject undefined.");
            e === b.Connected ? i() : n(t || new Error("Connect aborted."));
        }
        if (s === b.Disconnecting) {
            if (!a) throw new Error("Disconnect resolve undefined.");
            if (!g) throw new Error("Disconnect reject undefined.");
            e === b.Disconnected ? a() : g(t || new Error("Disconnect aborted."));
        }
        this.transitioningState = !1;
    }
    clearKeepAliveTimeout() {
        this.keepAliveDebounceTimeout && clearTimeout(this.keepAliveDebounceTimeout), this.keepAliveDebounceTimeout = void 0;
    }
    sendKeepAlive() {
        return this.keepAliveDebounceTimeout ? Promise.resolve() : (this.keepAliveDebounceTimeout = setTimeout(()=>{
            this.clearKeepAliveTimeout();
        }, this.configuration.keepAliveDebounce * 1000), this.send(`\r
\r
`));
    }
    startSendingKeepAlives() {
        let e = (t)=>{
            let r = t * 0.8;
            return 1000 * (Math.random() * (t - r) + r);
        };
        this.configuration.keepAliveInterval && !this.keepAliveInterval && (this.keepAliveInterval = setInterval(()=>{
            this.sendKeepAlive(), this.startSendingKeepAlives();
        }, e(this.configuration.keepAliveInterval)));
    }
    stopSendingKeepAlives() {
        this.keepAliveInterval && clearInterval(this.keepAliveInterval), this.keepAliveDebounceTimeout && clearTimeout(this.keepAliveDebounceTimeout), this.keepAliveInterval = void 0, this.keepAliveDebounceTimeout = void 0;
    }
};
we.defaultOptions = {
    server: "",
    connectionTimeout: 5,
    keepAliveInterval: 0,
    keepAliveDebounce: 10,
    traceSip: !0
};
var Pt = "0.20.0";
var ae = class {
    constructor(e = {}){
        if (this._publishers = {}, this._registerers = {}, this._sessions = {}, this._subscriptions = {}, this._state = U.Stopped, this.unloadListener = ()=>{
            this.stop();
        }, this._stateEventEmitter = new ne, this.delegate = e.delegate, this.options = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, ae.defaultOptions()), {
            sipjsId: ie(5)
        }), {
            uri: new B("sip", "anonymous." + ie(6), "anonymous.invalid")
        }), {
            viaHost: ie(12) + ".invalid"
        }), ae.stripUndefinedProperties(e)), this.options.hackIpInContact) if (typeof this.options.hackIpInContact == "boolean" && this.options.hackIpInContact) {
            let t = 1, r = 254, s = Math.floor(Math.random() * (r - t + 1) + t);
            this.options.viaHost = "192.0.2." + s;
        } else this.options.hackIpInContact && (this.options.viaHost = this.options.hackIpInContact);
        switch(this.loggerFactory = new ot, this.logger = this.loggerFactory.getLogger("sip.UserAgent"), this.loggerFactory.builtinEnabled = this.options.logBuiltinEnabled, this.loggerFactory.connector = this.options.logConnector, this.options.logLevel){
            case "error":
                this.loggerFactory.level = M.error;
                break;
            case "warn":
                this.loggerFactory.level = M.warn;
                break;
            case "log":
                this.loggerFactory.level = M.log;
                break;
            case "debug":
                this.loggerFactory.level = M.debug;
                break;
            default:
                break;
        }
        if (this.options.logConfiguration && (this.logger.log("Configuration:"), Object.keys(this.options).forEach((t)=>{
            let r = this.options[t];
            switch(t){
                case "uri":
                case "sessionDescriptionHandlerFactory":
                    this.logger.log("\xB7 " + t + ": " + r);
                    break;
                case "authorizationPassword":
                    this.logger.log("\xB7 " + t + ": NOT SHOWN");
                    break;
                case "transportConstructor":
                    this.logger.log("\xB7 " + t + ": " + r.name);
                    break;
                default:
                    this.logger.log("\xB7 " + t + ": " + JSON.stringify(r));
            }
        })), this.options.transportOptions) {
            let t = this.options.transportOptions, r = t.maxReconnectionAttempts, s = t.reconnectionTimeout;
            if (r !== void 0) {
                let i = 'The transport option "maxReconnectionAttempts" as has apparently been specified and has been deprecated. It will no longer be available starting with SIP.js release 0.16.0. Please update accordingly.';
                this.logger.warn(i);
            }
            if (s !== void 0) {
                let i = 'The transport option "reconnectionTimeout" as has apparently been specified and has been deprecated. It will no longer be available starting with SIP.js release 0.16.0. Please update accordingly.';
                this.logger.warn(i);
            }
            e.reconnectionDelay === void 0 && s !== void 0 && (this.options.reconnectionDelay = s), e.reconnectionAttempts === void 0 && r !== void 0 && (this.options.reconnectionAttempts = r);
        }
        if (e.reconnectionDelay !== void 0) {
            let t = 'The user agent option "reconnectionDelay" as has apparently been specified and has been deprecated. It will no longer be available starting with SIP.js release 0.16.0. Please update accordingly.';
            this.logger.warn(t);
        }
        if (e.reconnectionAttempts !== void 0) {
            let t = 'The user agent option "reconnectionAttempts" as has apparently been specified and has been deprecated. It will no longer be available starting with SIP.js release 0.16.0. Please update accordingly.';
            this.logger.warn(t);
        }
        this._transport = new this.options.transportConstructor(this.getLogger("sip.Transport"), this.options.transportOptions), this.initTransportCallbacks(), this._contact = this.initContact(), this._userAgentCore = this.initCore(), this.options.autoStart && this.start();
    }
    static makeURI(e) {
        return R.URIParse(e);
    }
    static defaultOptions() {
        return {
            allowLegacyNotifications: !1,
            authorizationHa1: "",
            authorizationPassword: "",
            authorizationUsername: "",
            autoStart: !1,
            autoStop: !0,
            delegate: {},
            contactName: "",
            contactParams: {
                transport: "ws"
            },
            displayName: "",
            forceRport: !1,
            hackAllowUnregisteredOptionTags: !1,
            hackIpInContact: !1,
            hackViaTcp: !1,
            logBuiltinEnabled: !0,
            logConfiguration: !0,
            logConnector: ()=>{},
            logLevel: "log",
            noAnswerTimeout: 60,
            preloadedRouteSet: [],
            reconnectionAttempts: 0,
            reconnectionDelay: 4,
            sendInitialProvisionalResponse: !0,
            sessionDescriptionHandlerFactory: It(),
            sessionDescriptionHandlerFactoryOptions: {},
            sipExtension100rel: W.Unsupported,
            sipExtensionReplaces: W.Unsupported,
            sipExtensionExtraSupported: [],
            sipjsId: "",
            transportConstructor: we,
            transportOptions: {},
            uri: new B("sip", "anonymous", "anonymous.invalid"),
            userAgentString: "SIP.js/" + Pt,
            viaHost: ""
        };
    }
    static stripUndefinedProperties(e) {
        return Object.keys(e).reduce((t, r)=>(e[r] !== void 0 && (t[r] = e[r]), t)
        , {});
    }
    get configuration() {
        return this.options;
    }
    get contact() {
        return this._contact;
    }
    get state() {
        return this._state;
    }
    get stateChange() {
        return this._stateEventEmitter;
    }
    get transport() {
        return this._transport;
    }
    get userAgentCore() {
        return this._userAgentCore;
    }
    getLogger(e, t) {
        return this.loggerFactory.getLogger(e, t);
    }
    getLoggerFactory() {
        return this.loggerFactory;
    }
    isConnected() {
        return this.transport.isConnected();
    }
    reconnect() {
        return this.state === U.Stopped ? Promise.reject(new Error("User agent stopped.")) : Promise.resolve().then(()=>this.transport.connect()
        );
    }
    start() {
        if (this.state === U.Started) return this.logger.warn("User agent already started"), Promise.resolve();
        if (this.logger.log(`Starting ${this.configuration.uri}`), this.transitionState(U.Started), this.options.autoStop) {
            let e = !!(typeof chrome != "undefined" && chrome.app && chrome.app.runtime);
            typeof window != "undefined" && typeof window.addEventListener == "function" && !e && window.addEventListener("unload", this.unloadListener);
        }
        return this.transport.connect();
    }
    async stop() {
        if (this.state === U.Stopped) return this.logger.warn("User agent already stopped"), Promise.resolve();
        if (this.logger.log(`Stopping ${this.configuration.uri}`), this.transitionState(U.Stopped), this.options.autoStop) {
            let a = !!(typeof chrome != "undefined" && chrome.app && chrome.app.runtime);
            typeof window != "undefined" && window.removeEventListener && !a && window.removeEventListener("unload", this.unloadListener);
        }
        let e = Object.assign({}, this._publishers), t = Object.assign({}, this._registerers), r = Object.assign({}, this._sessions), s = Object.assign({}, this._subscriptions), i = this.transport, n = this.userAgentCore;
        this.logger.log("Dispose of registerers");
        for(let a4 in t)t[a4] && await t[a4].dispose().catch((g)=>{
            throw this.logger.error(g.message), delete this._registerers[a4], g;
        });
        this.logger.log("Dispose of sessions");
        for(let a1 in r)r[a1] && await r[a1].dispose().catch((g)=>{
            throw this.logger.error(g.message), delete this._sessions[a1], g;
        });
        this.logger.log("Dispose of subscriptions");
        for(let a2 in s)s[a2] && await s[a2].dispose().catch((g)=>{
            throw this.logger.error(g.message), delete this._subscriptions[a2], g;
        });
        this.logger.log("Dispose of publishers");
        for(let a3 in e)e[a3] && await e[a3].dispose().catch((g)=>{
            throw this.logger.error(g.message), delete this._publishers[a3], g;
        });
        this.logger.log("Dispose of transport"), await i.dispose().catch((a)=>{
            throw this.logger.error(a.message), a;
        }), this.logger.log("Dispose of core"), n.dispose();
    }
    _makeInviter(e, t) {
        return new Ee(this, e, t);
    }
    attemptReconnection(e = 1) {
        let t = this.options.reconnectionAttempts, r = this.options.reconnectionDelay;
        if (e > t) {
            this.logger.log("Maximum reconnection attempts reached");
            return;
        }
        this.logger.log(`Reconnection attempt ${e} of ${t} - trying`), setTimeout(()=>{
            this.reconnect().then(()=>{
                this.logger.log(`Reconnection attempt ${e} of ${t} - succeeded`);
            }).catch((s)=>{
                this.logger.error(s.message), this.logger.log(`Reconnection attempt ${e} of ${t} - failed`), this.attemptReconnection(++e);
            });
        }, e === 1 ? 0 : r * 1000);
    }
    initContact() {
        let e = this.options.contactName !== "" ? this.options.contactName : ie(8), t = this.options.contactParams;
        return {
            pubGruu: void 0,
            tempGruu: void 0,
            uri: new B("sip", e, this.options.viaHost, void 0, t),
            toString: (s = {})=>{
                let i = s.anonymous || !1, n = s.outbound || !1, a = "<";
                return i ? a += this.contact.tempGruu || `sip:anonymous@anonymous.invalid;transport=${t.transport ? t.transport : "ws"}` : a += this.contact.pubGruu || this.contact.uri, n && (a += ";ob"), a += ">", a;
            }
        };
    }
    initCore() {
        let e = [];
        e.push("outbound"), this.options.sipExtension100rel === W.Supported && e.push("100rel"), this.options.sipExtensionReplaces === W.Supported && e.push("replaces"), this.options.sipExtensionExtraSupported && e.push(...this.options.sipExtensionExtraSupported), this.options.hackAllowUnregisteredOptionTags || (e = e.filter((i)=>Ht[i]
        )), e = Array.from(new Set(e));
        let t = e.slice();
        (this.contact.pubGruu || this.contact.tempGruu) && t.push("gruu");
        let r = {
            aor: this.options.uri,
            contact: this.contact,
            displayName: this.options.displayName,
            loggerFactory: this.loggerFactory,
            hackViaTcp: this.options.hackViaTcp,
            routeSet: this.options.preloadedRouteSet,
            supportedOptionTags: e,
            supportedOptionTagsResponse: t,
            sipjsId: this.options.sipjsId,
            userAgentHeaderFieldValue: this.options.userAgentString,
            viaForceRport: this.options.forceRport,
            viaHost: this.options.viaHost,
            authenticationFactory: ()=>{
                let i = this.options.authorizationUsername ? this.options.authorizationUsername : this.options.uri.user, n = this.options.authorizationPassword ? this.options.authorizationPassword : void 0, a = this.options.authorizationHa1 ? this.options.authorizationHa1 : void 0;
                return new We(this.getLoggerFactory(), a, i, n);
            },
            transportAccessor: ()=>this.transport
        }, s = {
            onInvite: (i)=>{
                var n;
                let a = new me(this, i);
                if (i.delegate = {
                    onCancel: (g)=>{
                        a._onCancel(g);
                    },
                    onTransportError: (g)=>{
                        this.logger.error("A transport error has occurred while handling an incoming INVITE request.");
                    }
                }, i.trying(), this.options.sipExtensionReplaces !== W.Unsupported) {
                    let w = i.message.parseHeader("replaces");
                    if (w) {
                        let u = w.call_id;
                        if (typeof u != "string") throw new Error("Type of call id is not string");
                        let v = w.replaces_to_tag;
                        if (typeof v != "string") throw new Error("Type of to tag is not string");
                        let E = w.replaces_from_tag;
                        if (typeof E != "string") throw new Error("type of from tag is not string");
                        let H = u + v + E, S = this.userAgentCore.dialogs.get(H);
                        if (!S) {
                            a.reject({
                                statusCode: 481
                            });
                            return;
                        }
                        if (!S.early && w.early_only === !0) {
                            a.reject({
                                statusCode: 486
                            });
                            return;
                        }
                        let V = this._sessions[u + E] || this._sessions[u + v] || void 0;
                        if (!V) throw new Error("Session does not exist.");
                        a._replacee = V;
                    }
                }
                if ((n = this.delegate) === null || n === void 0 ? void 0 : n.onInvite) {
                    if (a.autoSendAnInitialProvisionalResponse) {
                        a.progress().then(()=>{
                            var g;
                            if (((g = this.delegate) === null || g === void 0 ? void 0 : g.onInvite) === void 0) throw new Error("onInvite undefined.");
                            this.delegate.onInvite(a);
                        });
                        return;
                    }
                    this.delegate.onInvite(a);
                    return;
                }
                a.reject({
                    statusCode: 486
                });
            },
            onMessage: (i)=>{
                if (this.delegate && this.delegate.onMessage) {
                    let n = new Me(i);
                    this.delegate.onMessage(n);
                } else i.accept();
            },
            onNotify: (i)=>{
                if (this.delegate && this.delegate.onNotify) {
                    let n = new Ce(i);
                    this.delegate.onNotify(n);
                } else this.options.allowLegacyNotifications ? i.accept() : i.reject({
                    statusCode: 481
                });
            },
            onRefer: (i)=>{
                this.logger.warn("Received an out of dialog REFER request"), this.delegate && this.delegate.onReferRequest ? this.delegate.onReferRequest(i) : i.reject({
                    statusCode: 405
                });
            },
            onRegister: (i)=>{
                this.logger.warn("Received an out of dialog REGISTER request"), this.delegate && this.delegate.onRegisterRequest ? this.delegate.onRegisterRequest(i) : i.reject({
                    statusCode: 405
                });
            },
            onSubscribe: (i)=>{
                this.logger.warn("Received an out of dialog SUBSCRIBE request"), this.delegate && this.delegate.onSubscribeRequest ? this.delegate.onSubscribeRequest(i) : i.reject({
                    statusCode: 405
                });
            }
        };
        return new gt(r, s);
    }
    initTransportCallbacks() {
        this.transport.onConnect = ()=>this.onTransportConnect()
        , this.transport.onDisconnect = (e)=>this.onTransportDisconnect(e)
        , this.transport.onMessage = (e)=>this.onTransportMessage(e)
        ;
    }
    onTransportConnect() {
        this.state !== U.Stopped && this.delegate && this.delegate.onConnect && this.delegate.onConnect();
    }
    onTransportDisconnect(e) {
        this.state !== U.Stopped && (this.delegate && this.delegate.onDisconnect && this.delegate.onDisconnect(e), e && this.options.reconnectionAttempts > 0 && this.attemptReconnection());
    }
    onTransportMessage(e) {
        let t = je.parseMessage(e, this.getLogger("sip.Parser"));
        if (!t) {
            this.logger.warn("Failed to parse incoming message. Dropping.");
            return;
        }
        if (this.state === U.Stopped && t instanceof ee) {
            this.logger.warn(`Received ${t.method} request while stopped. Dropping.`);
            return;
        }
        let r = ()=>{
            let s = [
                "from",
                "to",
                "call_id",
                "cseq",
                "via"
            ];
            for (let i of s)if (!t.hasHeader(i)) return this.logger.warn(`Missing mandatory header field : ${i}.`), !1;
            return !0;
        };
        if (t instanceof ee) {
            if (!r()) {
                this.logger.warn("Request missing mandatory header field. Dropping.");
                return;
            }
            if (!t.toTag && t.callId.substr(0, 5) === this.options.sipjsId) {
                this.userAgentCore.replyStateless(t, {
                    statusCode: 482
                });
                return;
            }
            let s = le(t.body), i = t.getHeader("content-length");
            if (i && s < Number(i)) {
                this.userAgentCore.replyStateless(t, {
                    statusCode: 400
                });
                return;
            }
        }
        if (t instanceof G) {
            if (!r()) {
                this.logger.warn("Response missing mandatory header field. Dropping.");
                return;
            }
            if (t.getHeaders("via").length > 1) {
                this.logger.warn("More than one Via header field present in the response. Dropping.");
                return;
            }
            if (t.via.host !== this.options.viaHost || t.via.port !== void 0) {
                this.logger.warn("Via sent-by in the response does not match UA Via host value. Dropping.");
                return;
            }
            let s = le(t.body), i = t.getHeader("content-length");
            if (i && s < Number(i)) {
                this.logger.warn("Message body length is lower than the value in Content-Length header field. Dropping.");
                return;
            }
        }
        if (t instanceof ee) {
            this.userAgentCore.receiveIncomingRequestFromTransport(t);
            return;
        }
        if (t instanceof G) {
            this.userAgentCore.receiveIncomingResponseFromTransport(t);
            return;
        }
        throw new Error("Invalid message type.");
    }
    transitionState(e, t) {
        let r = ()=>{
            throw new Error(`Invalid state transition from ${this._state} to ${e}`);
        };
        switch(this._state){
            case U.Started:
                e !== U.Stopped && r();
                break;
            case U.Stopped:
                e !== U.Started && r();
                break;
            default:
                throw new Error("Unknown state.");
        }
        this.logger.log(`Transitioned from ${this._state} to ${e}`), this._state = e, this._stateEventEmitter.emit(this._state);
    }
};
var Vt = class {
    constructor(e, t = {}){
        this.attemptingReconnection = !1, this.connectRequested = !1, this.held = !1, this.muted = !1, this.registerer = void 0, this.registerRequested = !1, this.session = void 0, this.delegate = t.delegate, this.options = Object.assign({}, t);
        let r = Object.assign({}, t.userAgentOptions);
        if (r.transportConstructor || (r.transportConstructor = we), r.transportOptions || (r.transportOptions = {
            server: e
        }), !r.uri && t.aor) {
            let s = ae.makeURI(t.aor);
            if (!s) throw new Error(`Failed to create valid URI from ${t.aor}`);
            r.uri = s;
        }
        this.userAgent = new ae(r), this.userAgent.delegate = {
            onConnect: ()=>{
                this.logger.log(`[${this.id}] Connected`), this.delegate && this.delegate.onServerConnect && this.delegate.onServerConnect(), this.registerer && this.registerRequested && (this.logger.log(`[${this.id}] Registering...`), this.registerer.register().catch((s)=>{
                    this.logger.error(`[${this.id}] Error occurred registering after connection with server was obtained.`), this.logger.error(s.toString());
                }));
            },
            onDisconnect: (s)=>{
                this.logger.log(`[${this.id}] Disconnected`), this.delegate && this.delegate.onServerDisconnect && this.delegate.onServerDisconnect(s), this.session && (this.logger.log(`[${this.id}] Hanging up...`), this.hangup().catch((i)=>{
                    this.logger.error(`[${this.id}] Error occurred hanging up call after connection with server was lost.`), this.logger.error(i.toString());
                })), this.registerer && (this.logger.log(`[${this.id}] Unregistering...`), this.registerer.unregister().catch((i)=>{
                    this.logger.error(`[${this.id}] Error occurred unregistering after connection with server was lost.`), this.logger.error(i.toString());
                })), s && this.attemptReconnection();
            },
            onInvite: (s)=>{
                if (this.logger.log(`[${this.id}] Received INVITE`), this.session) {
                    this.logger.warn(`[${this.id}] Session already in progress, rejecting INVITE...`), s.reject().then(()=>{
                        this.logger.log(`[${this.id}] Rejected INVITE`);
                    }).catch((n)=>{
                        this.logger.error(`[${this.id}] Failed to reject INVITE`), this.logger.error(n.toString());
                    });
                    return;
                }
                let i = {
                    sessionDescriptionHandlerOptions: {
                        constraints: this.constraints
                    }
                };
                this.initSession(s, i), this.delegate && this.delegate.onCallReceived ? this.delegate.onCallReceived() : (this.logger.warn(`[${this.id}] No handler available, rejecting INVITE...`), s.reject().then(()=>{
                    this.logger.log(`[${this.id}] Rejected INVITE`);
                }).catch((n)=>{
                    this.logger.error(`[${this.id}] Failed to reject INVITE`), this.logger.error(n.toString());
                }));
            },
            onMessage: (s)=>{
                s.accept().then(()=>{
                    this.delegate && this.delegate.onMessageReceived && this.delegate.onMessageReceived(s.request.body);
                });
            }
        }, this.logger = this.userAgent.getLogger("sip.SimpleUser"), window.addEventListener("online", ()=>{
            this.logger.log(`[${this.id}] Online`), this.attemptReconnection();
        });
    }
    get id() {
        return this.options.userAgentOptions && this.options.userAgentOptions.displayName || "Anonymous";
    }
    get localMediaStream() {
        var e;
        let t = (e = this.session) === null || e === void 0 ? void 0 : e.sessionDescriptionHandler;
        if (!!t) {
            if (!(t instanceof j)) throw new Error("Session description handler not instance of web SessionDescriptionHandler");
            return t.localMediaStream;
        }
    }
    get remoteMediaStream() {
        var e;
        let t = (e = this.session) === null || e === void 0 ? void 0 : e.sessionDescriptionHandler;
        if (!!t) {
            if (!(t instanceof j)) throw new Error("Session description handler not instance of web SessionDescriptionHandler");
            return t.remoteMediaStream;
        }
    }
    get localAudioTrack() {
        var e;
        return (e = this.localMediaStream) === null || e === void 0 ? void 0 : e.getTracks().find((t)=>t.kind === "audio"
        );
    }
    get localVideoTrack() {
        var e;
        return (e = this.localMediaStream) === null || e === void 0 ? void 0 : e.getTracks().find((t)=>t.kind === "video"
        );
    }
    get remoteAudioTrack() {
        var e;
        return (e = this.remoteMediaStream) === null || e === void 0 ? void 0 : e.getTracks().find((t)=>t.kind === "audio"
        );
    }
    get remoteVideoTrack() {
        var e;
        return (e = this.remoteMediaStream) === null || e === void 0 ? void 0 : e.getTracks().find((t)=>t.kind === "video"
        );
    }
    connect() {
        return this.logger.log(`[${this.id}] Connecting UserAgent...`), this.connectRequested = !0, this.userAgent.state !== U.Started ? this.userAgent.start() : this.userAgent.reconnect();
    }
    disconnect() {
        return this.logger.log(`[${this.id}] Disconnecting UserAgent...`), this.connectRequested = !1, this.userAgent.stop();
    }
    isConnected() {
        return this.userAgent.isConnected();
    }
    register(e, t) {
        return this.logger.log(`[${this.id}] Registering UserAgent...`), this.registerRequested = !0, this.registerer || (this.registerer = new Y(this.userAgent, e), this.registerer.stateChange.addListener((r)=>{
            switch(r){
                case y.Initial:
                    break;
                case y.Registered:
                    this.delegate && this.delegate.onRegistered && this.delegate.onRegistered();
                    break;
                case y.Unregistered:
                    this.delegate && this.delegate.onUnregistered && this.delegate.onUnregistered();
                    break;
                case y.Terminated:
                    this.registerer = void 0;
                    break;
                default:
                    throw new Error("Unknown registerer state.");
            }
        })), this.registerer.register(t).then(()=>{});
    }
    unregister(e) {
        return this.logger.log(`[${this.id}] Unregistering UserAgent...`), this.registerRequested = !1, this.registerer ? this.registerer.unregister(e).then(()=>{}) : Promise.resolve();
    }
    call(e, t, r) {
        if (this.logger.log(`[${this.id}] Beginning Session...`), this.session) return Promise.reject(new Error("Session already exists."));
        let s = ae.makeURI(e);
        if (!s) return Promise.reject(new Error(`Failed to create a valid URI from "${e}"`));
        t || (t = {}), t.sessionDescriptionHandlerOptions || (t.sessionDescriptionHandlerOptions = {}), t.sessionDescriptionHandlerOptions.constraints || (t.sessionDescriptionHandlerOptions.constraints = this.constraints);
        let i = new Ee(this.userAgent, s, t);
        return this.sendInvite(i, t, r).then(()=>{});
    }
    hangup() {
        return this.logger.log(`[${this.id}] Hangup...`), this.terminate();
    }
    answer(e) {
        return this.logger.log(`[${this.id}] Accepting Invitation...`), this.session ? this.session instanceof me ? (e || (e = {}), e.sessionDescriptionHandlerOptions || (e.sessionDescriptionHandlerOptions = {}), e.sessionDescriptionHandlerOptions.constraints || (e.sessionDescriptionHandlerOptions.constraints = this.constraints), this.session.accept(e)) : Promise.reject(new Error("Session not instance of Invitation.")) : Promise.reject(new Error("Session does not exist."));
    }
    decline() {
        return this.logger.log(`[${this.id}] rejecting Invitation...`), this.session ? this.session instanceof me ? this.session.reject() : Promise.reject(new Error("Session not instance of Invitation.")) : Promise.reject(new Error("Session does not exist."));
    }
    hold() {
        return this.logger.log(`[${this.id}] holding session...`), this.setHold(!0);
    }
    unhold() {
        return this.logger.log(`[${this.id}] unholding session...`), this.setHold(!1);
    }
    isHeld() {
        return this.held;
    }
    mute() {
        this.logger.log(`[${this.id}] disabling media tracks...`), this.setMute(!0);
    }
    unmute() {
        this.logger.log(`[${this.id}] enabling media tracks...`), this.setMute(!1);
    }
    isMuted() {
        return this.muted;
    }
    sendDTMF(e) {
        if (this.logger.log(`[${this.id}] sending DTMF...`), !/^[0-9A-D#*,]$/.exec(e)) return Promise.reject(new Error("Invalid DTMF tone."));
        if (!this.session) return Promise.reject(new Error("Session does not exist."));
        this.logger.log(`[${this.id}] Sending DTMF tone: ${e}`);
        let t = e, r = 2000, i = {
            body: {
                contentDisposition: "render",
                contentType: "application/dtmf-relay",
                content: "Signal=" + t + `\r
Duration=` + r
            }
        };
        return this.session.info({
            requestOptions: i
        }).then(()=>{});
    }
    message(e, t) {
        this.logger.log(`[${this.id}] sending message...`);
        let r = ae.makeURI(e);
        return r ? new xt(this.userAgent, r, t).message() : Promise.reject(new Error(`Failed to create a valid URI from "${e}"`));
    }
    get constraints() {
        var e;
        let t = {
            audio: !0,
            video: !1
        };
        return ((e = this.options.media) === null || e === void 0 ? void 0 : e.constraints) && (t = Object.assign({}, this.options.media.constraints)), t;
    }
    attemptReconnection(e = 1) {
        let t = this.options.reconnectionAttempts || 3, r = this.options.reconnectionDelay || 4;
        if (!this.connectRequested) {
            this.logger.log(`[${this.id}] Reconnection not currently desired`);
            return;
        }
        if (this.attemptingReconnection && this.logger.log(`[${this.id}] Reconnection attempt already in progress`), e > t) {
            this.logger.log(`[${this.id}] Reconnection maximum attempts reached`);
            return;
        }
        e === 1 ? this.logger.log(`[${this.id}] Reconnection attempt ${e} of ${t} - trying`) : this.logger.log(`[${this.id}] Reconnection attempt ${e} of ${t} - trying in ${r} seconds`), this.attemptingReconnection = !0, setTimeout(()=>{
            if (!this.connectRequested) {
                this.logger.log(`[${this.id}] Reconnection attempt ${e} of ${t} - aborted`), this.attemptingReconnection = !1;
                return;
            }
            this.userAgent.reconnect().then(()=>{
                this.logger.log(`[${this.id}] Reconnection attempt ${e} of ${t} - succeeded`), this.attemptingReconnection = !1;
            }).catch((s)=>{
                this.logger.log(`[${this.id}] Reconnection attempt ${e} of ${t} - failed`), this.logger.error(s.message), this.attemptingReconnection = !1, this.attemptReconnection(++e);
            });
        }, e === 1 ? 0 : r * 1000);
    }
    cleanupMedia() {
        this.options.media && (this.options.media.local && this.options.media.local.video && (this.options.media.local.video.srcObject = null, this.options.media.local.video.pause()), this.options.media.remote && (this.options.media.remote.audio && (this.options.media.remote.audio.srcObject = null, this.options.media.remote.audio.pause()), this.options.media.remote.video && (this.options.media.remote.video.srcObject = null, this.options.media.remote.video.pause())));
    }
    enableReceiverTracks(e) {
        if (!this.session) throw new Error("Session does not exist.");
        let t = this.session.sessionDescriptionHandler;
        if (!(t instanceof j)) throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
        let r = t.peerConnection;
        if (!r) throw new Error("Peer connection closed.");
        r.getReceivers().forEach((s)=>{
            s.track && (s.track.enabled = e);
        });
    }
    enableSenderTracks(e) {
        if (!this.session) throw new Error("Session does not exist.");
        let t = this.session.sessionDescriptionHandler;
        if (!(t instanceof j)) throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
        let r = t.peerConnection;
        if (!r) throw new Error("Peer connection closed.");
        r.getSenders().forEach((s)=>{
            s.track && (s.track.enabled = e);
        });
    }
    initSession(e, t) {
        this.session = e, this.delegate && this.delegate.onCallCreated && this.delegate.onCallCreated(), this.session.stateChange.addListener((r)=>{
            if (this.session === e) switch(this.logger.log(`[${this.id}] session state changed to ${r}`), r){
                case m.Initial:
                    break;
                case m.Establishing:
                    break;
                case m.Established:
                    this.setupLocalMedia(), this.setupRemoteMedia(), this.delegate && this.delegate.onCallAnswered && this.delegate.onCallAnswered();
                    break;
                case m.Terminating:
                case m.Terminated:
                    this.session = void 0, this.cleanupMedia(), this.delegate && this.delegate.onCallHangup && this.delegate.onCallHangup();
                    break;
                default:
                    throw new Error("Unknown session state.");
            }
        }), this.session.delegate = {
            onInfo: (r)=>{
                var s;
                if (((s = this.delegate) === null || s === void 0 ? void 0 : s.onCallDTMFReceived) === void 0) {
                    r.reject();
                    return;
                }
                let i = r.request.getHeader("content-type");
                if (!i || !/^application\/dtmf-relay/i.exec(i)) {
                    r.reject();
                    return;
                }
                let n = r.request.body.split(`\r
`, 2);
                if (n.length !== 2) {
                    r.reject();
                    return;
                }
                let a, g = /^(Signal\s*?=\s*?)([0-9A-D#*]{1})(\s)?.*/;
                if (g.test(n[0]) && (a = n[0].replace(g, "$2")), !a) {
                    r.reject();
                    return;
                }
                let w, u = /^(Duration\s?=\s?)([0-9]{1,4})(\s)?.*/;
                if (u.test(n[1]) && (w = parseInt(n[1].replace(u, "$2"), 10)), !w) {
                    r.reject();
                    return;
                }
                r.accept().then(()=>{
                    if (this.delegate && this.delegate.onCallDTMFReceived) {
                        if (!a || !w) throw new Error("Tone or duration undefined.");
                        this.delegate.onCallDTMFReceived(a, w);
                    }
                }).catch((v)=>{
                    this.logger.error(v.message);
                });
            },
            onRefer: (r)=>{
                r.accept().then(()=>this.sendInvite(r.makeInviter(t), t)
                ).catch((s)=>{
                    this.logger.error(s.message);
                });
            }
        };
    }
    sendInvite(e, t, r) {
        return this.initSession(e, t), e.invite(r).then(()=>{
            this.logger.log(`[${this.id}] sent INVITE`);
        });
    }
    setHold(e) {
        if (!this.session) return Promise.reject(new Error("Session does not exist."));
        let t = this.session;
        if (this.held === e) return Promise.resolve();
        if (!(this.session.sessionDescriptionHandler instanceof j)) throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
        let s = {
            requestDelegate: {
                onAccept: ()=>{
                    this.held = e, this.enableReceiverTracks(!this.held), this.enableSenderTracks(!this.held && !this.muted), this.delegate && this.delegate.onCallHold && this.delegate.onCallHold(this.held);
                },
                onReject: ()=>{
                    this.logger.warn(`[${this.id}] re-invite request was rejected`), this.enableReceiverTracks(!this.held), this.enableSenderTracks(!this.held && !this.muted), this.delegate && this.delegate.onCallHold && this.delegate.onCallHold(this.held);
                }
            }
        }, i = t.sessionDescriptionHandlerOptionsReInvite;
        return i.hold = e, t.sessionDescriptionHandlerOptionsReInvite = i, this.session.invite(s).then(()=>{
            this.enableReceiverTracks(!e), this.enableSenderTracks(!e && !this.muted);
        }).catch((n)=>{
            throw n instanceof pe && this.logger.error(`[${this.id}] A hold request is already in progress.`), n;
        });
    }
    setMute(e) {
        if (!this.session) {
            this.logger.warn(`[${this.id}] A session is required to enabled/disable media tracks`);
            return;
        }
        if (this.session.state !== m.Established) {
            this.logger.warn(`[${this.id}] An established session is required to enable/disable media tracks`);
            return;
        }
        this.muted = e, this.enableSenderTracks(!this.held && !this.muted);
    }
    setupLocalMedia() {
        var e, t;
        if (!this.session) throw new Error("Session does not exist.");
        let r = (t = (e = this.options.media) === null || e === void 0 ? void 0 : e.local) === null || t === void 0 ? void 0 : t.video;
        if (r) {
            let s = this.localMediaStream;
            if (!s) throw new Error("Local media stream undefiend.");
            r.srcObject = s, r.volume = 0, r.play().catch((i)=>{
                this.logger.error(`[${this.id}] Failed to play local media`), this.logger.error(i.message);
            });
        }
    }
    setupRemoteMedia() {
        var e, t, r, s;
        if (!this.session) throw new Error("Session does not exist.");
        let i = ((t = (e = this.options.media) === null || e === void 0 ? void 0 : e.remote) === null || t === void 0 ? void 0 : t.video) || ((s = (r = this.options.media) === null || r === void 0 ? void 0 : r.remote) === null || s === void 0 ? void 0 : s.audio);
        if (i) {
            let n = this.remoteMediaStream;
            if (!n) throw new Error("Remote media stream undefiend.");
            i.autoplay = !0, i.srcObject = n, i.play().catch((a)=>{
                this.logger.error(`[${this.id}] Failed to play remote media`), this.logger.error(a.message);
            }), n.onaddtrack = ()=>{
                this.logger.log(`[${this.id}] Remote media onaddtrack`), i.load(), i.play().catch((a)=>{
                    this.logger.error(`[${this.id}] Failed to play remote media`), this.logger.error(a.message);
                });
            };
        }
    }
    terminate() {
        if (this.logger.log(`[${this.id}] Terminating...`), !this.session) return Promise.reject(new Error("Session does not exist."));
        switch(this.session.state){
            case m.Initial:
                if (this.session instanceof Ee) return this.session.cancel().then(()=>{
                    this.logger.log(`[${this.id}] Inviter never sent INVITE (canceled)`);
                });
                if (this.session instanceof me) return this.session.reject().then(()=>{
                    this.logger.log(`[${this.id}] Invitation rejected (sent 480)`);
                });
                throw new Error("Unknown session type.");
            case m.Establishing:
                if (this.session instanceof Ee) return this.session.cancel().then(()=>{
                    this.logger.log(`[${this.id}] Inviter canceled (sent CANCEL)`);
                });
                if (this.session instanceof me) return this.session.reject().then(()=>{
                    this.logger.log(`[${this.id}] Invitation rejected (sent 480)`);
                });
                throw new Error("Unknown session type.");
            case m.Established:
                return this.session.bye().then(()=>{
                    this.logger.log(`[${this.id}] Session ended (sent BYE)`);
                });
            case m.Terminating:
                break;
            case m.Terminated:
                break;
            default:
                throw new Error("Unknown state");
        }
        return this.logger.log(`[${this.id}] Terminating in state ${this.session.state}, no action taken`), Promise.resolve();
    }
};
function getAudio(id) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLAudioElement)) {
        throw new Error(`Element "${id}" not found or not an audio element.`);
    }
    return el;
}
function getButton(id) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLButtonElement)) {
        throw new Error(`Element "${id}" not found or not a button element.`);
    }
    return el;
}
function getButtons(id) {
    const els = document.getElementsByClassName(id);
    if (!els.length) {
        throw new Error(`Elements "${id}" not found.`);
    }
    const buttons = [];
    for(let i = 0; i < els.length; i++){
        const el = els[i];
        if (!(el instanceof HTMLButtonElement)) {
            throw new Error(`Element ${i} of "${id}" not a button element.`);
        }
        buttons.push(el);
    }
    return buttons;
}
function getInput(id) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLInputElement)) {
        throw new Error(`Element "${id}" not found or not an input element.`);
    }
    return el;
}
function getSpan(id) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLSpanElement)) {
        throw new Error(`Element "${id}" not found or not a span element.`);
    }
    return el;
}
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
    onCallCreated: ()=>{
        console.log(`[${displayName}] Call created`);
        callButton.disabled = true;
        hangupButton.disabled = false;
        keypadDisabled(true);
        holdCheckboxDisabled(true);
        muteCheckboxDisabled(true);
    },
    onCallAnswered: ()=>{
        console.log(`[${displayName}] Call answered`);
        keypadDisabled(false);
        holdCheckboxDisabled(false);
        muteCheckboxDisabled(false);
    },
    onCallHangup: ()=>{
        console.log(`[${displayName}] Call hangup`);
        callButton.disabled = false;
        hangupButton.disabled = true;
        keypadDisabled(true);
        holdCheckboxDisabled(true);
        muteCheckboxDisabled(true);
    },
    onCallHold: (held)=>{
        console.log(`[${displayName}] Call hold ${held}`);
        holdCheckbox.checked = held;
    }
};
const simpleUserOptions = {
    delegate: simpleUserDelegate,
    media: {
        remote: {
            audio: audioElement
        }
    },
    userAgentOptions: {
        displayName
    }
};
const simpleUser = new Vt(webSocketServer, simpleUserOptions);
connectButton.addEventListener("click", ()=>{
    connectButton.disabled = true;
    disconnectButton.disabled = true;
    callButton.disabled = true;
    hangupButton.disabled = true;
    simpleUser.connect().then(()=>{
        connectButton.disabled = true;
        disconnectButton.disabled = false;
        callButton.disabled = false;
        hangupButton.disabled = true;
    }).catch((error)=>{
        connectButton.disabled = false;
        console.error(`[${simpleUser.id}] failed to connect`);
        console.error(error);
        alert("Failed to connect.\n" + error);
    });
});
callButton.addEventListener("click", ()=>{
    callButton.disabled = true;
    hangupButton.disabled = true;
    simpleUser.call(target, {
        inviteWithoutSdp: false
    }).catch((error)=>{
        console.error(`[${simpleUser.id}] failed to place call`);
        console.error(error);
        alert("Failed to place call.\n" + error);
    });
});
hangupButton.addEventListener("click", ()=>{
    callButton.disabled = true;
    hangupButton.disabled = true;
    simpleUser.hangup().catch((error)=>{
        console.error(`[${simpleUser.id}] failed to hangup call`);
        console.error(error);
        alert("Failed to hangup call.\n" + error);
    });
});
disconnectButton.addEventListener("click", ()=>{
    connectButton.disabled = true;
    disconnectButton.disabled = true;
    callButton.disabled = true;
    hangupButton.disabled = true;
    simpleUser.disconnect().then(()=>{
        connectButton.disabled = false;
        disconnectButton.disabled = true;
        callButton.disabled = true;
        hangupButton.disabled = true;
    }).catch((error)=>{
        console.error(`[${simpleUser.id}] failed to disconnect`);
        console.error(error);
        alert("Failed to disconnect.\n" + error);
    });
});
keypad.forEach((button)=>{
    button.addEventListener("click", ()=>{
        const tone = button.textContent;
        if (tone) {
            simpleUser.sendDTMF(tone).then(()=>{
                dtmfSpan.innerHTML += tone;
            });
        }
    });
});
const keypadDisabled = (disabled)=>{
    keypad.forEach((button)=>button.disabled = disabled
    );
    dtmfSpan.innerHTML = "";
};
holdCheckbox.addEventListener("change", ()=>{
    if (holdCheckbox.checked) {
        simpleUser.hold().catch((error)=>{
            holdCheckbox.checked = false;
            console.error(`[${simpleUser.id}] failed to hold call`);
            console.error(error);
            alert("Failed to hold call.\n" + error);
        });
    } else {
        simpleUser.unhold().catch((error)=>{
            holdCheckbox.checked = true;
            console.error(`[${simpleUser.id}] failed to unhold call`);
            console.error(error);
            alert("Failed to unhold call.\n" + error);
        });
    }
});
const holdCheckboxDisabled = (disabled)=>{
    holdCheckbox.checked = false;
    holdCheckbox.disabled = disabled;
};
muteCheckbox.addEventListener("change", ()=>{
    if (muteCheckbox.checked) {
        simpleUser.mute();
        if (simpleUser.isMuted() === false) {
            muteCheckbox.checked = false;
            console.error(`[${simpleUser.id}] failed to mute call`);
            alert("Failed to mute call.\n");
        }
    } else {
        simpleUser.unmute();
        if (simpleUser.isMuted() === true) {
            muteCheckbox.checked = true;
            console.error(`[${simpleUser.id}] failed to unmute call`);
            alert("Failed to unmute call.\n");
        }
    }
});
const muteCheckboxDisabled = (disabled)=>{
    muteCheckbox.checked = false;
    muteCheckbox.disabled = disabled;
};
connectButton.disabled = false;
