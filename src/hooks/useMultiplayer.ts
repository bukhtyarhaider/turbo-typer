import { useEffect, useState, useCallback, useRef } from "react";
import Ably from "ably";
import { PlayerInfo } from "../types";

interface UseMultiplayerProps {
  userName: string;
  onOpponentJoined: (opponent: PlayerInfo) => void;
  onDataReceived: (data: any) => void;
  onConnected: (clientId: string) => void;
}

export const useMultiplayer = ({
  userName,
  onOpponentJoined,
  onDataReceived,
  onConnected,
}: UseMultiplayerProps) => {
  const [client, setClient] = useState<Ably.Realtime | null>(null);
  const [channel, setChannel] = useState<Ably.RealtimeChannel | null>(null);
  const [myId, setMyId] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "offline"
  >("connecting");
  const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set());
  const [roomId, setRoomId] = useState<string | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  // Use refs to avoid stale closures in event handlers
  const callbacks = useRef({
    onOpponentJoined,
    onDataReceived,
    onConnected,
  });

  useEffect(() => {
    callbacks.current = {
      onOpponentJoined,
      onDataReceived,
      onConnected,
    };
  }, [onOpponentJoined, onDataReceived, onConnected]);

  useEffect(() => {
    // Get Ably API key from environment variable
    const apiKey = import.meta.env.VITE_ABLY_API_KEY;

    if (!apiKey) {
      console.error(
        "Ably API key not found. Please set VITE_ABLY_API_KEY in your .env file"
      );
      setConnectionStatus("offline");
      setMyId("OFFLINE");
      return;
    }

    console.log("Ably: Initializing connection...");
    setConnectionStatus("connecting");

    // Create Ably Realtime client
    const ablyClient = new Ably.Realtime({
      key: apiKey,
      clientId: userName,
      echoMessages: false, // Don't receive our own messages
    });

    // Connection state listeners
    ablyClient.connection.on("connected", () => {
      const clientId = ablyClient.connection.id || userName;
      console.log("Ably: Connected with ID", clientId);
      setMyId(clientId);
      setConnectionStatus("connected");
      callbacks.current.onConnected(clientId);

      // Automatically join our own room so others can find us
      const myRoom = ablyClient.channels.get(`turbo-typer-room:${clientId}`);

      // Set up channel subscriptions for when others join our room
      myRoom.subscribe("player-joined", (message) => {
        const data = message.data;
        console.log(
          "Ably: Player joined message received",
          data,
          message.clientId
        );

        if (message.clientId && message.clientId !== userName) {
          callbacks.current.onOpponentJoined({
            id: message.clientId,
            name: data.name,
            wpm: 0,
            progress: 0,
            speed: 0,
            hasShield: false,
            score: 0,
          });
          setConnectedPeers((prev) => new Set(prev).add(message.clientId));
        }
      });

      myRoom.subscribe("game-data", (message) => {
        if (message.clientId && message.clientId !== userName) {
          callbacks.current.onDataReceived(message.data);
        }
      });

      myRoom.presence.subscribe("enter", (member) => {
        console.log(
          "Ably: Player entered my room",
          member.clientId,
          member.data
        );
        if (member.clientId && member.clientId !== userName) {
          callbacks.current.onOpponentJoined({
            id: member.clientId,
            name: member.data?.name || member.clientId,
            wpm: 0,
            progress: 0,
            speed: 0,
            hasShield: false,
            score: 0,
          });
          setConnectedPeers((prev) => new Set(prev).add(member.clientId));
        }
      });

      myRoom.presence.subscribe("leave", (member) => {
        console.log("Ably: Player left my room", member.clientId);
        if (member.clientId) {
          setConnectedPeers((prev) => {
            const next = new Set(prev);
            next.delete(member.clientId!);
            return next;
          });
        }
      });

      // Enter presence in our own room
      myRoom.presence.enter({ name: userName });

      // Store reference to our room channel
      channelRef.current = myRoom;
      setChannel(myRoom);
      setRoomId(clientId);
    });

    ablyClient.connection.on("connecting", () => {
      console.log("Ably: Connecting...");
      setConnectionStatus("connecting");
    });

    ablyClient.connection.on("disconnected", () => {
      console.warn("Ably: Disconnected");
      setConnectionStatus("offline");
    });

    ablyClient.connection.on("suspended", () => {
      console.warn("Ably: Connection suspended");
      setConnectionStatus("offline");
    });

    ablyClient.connection.on("failed", () => {
      console.error("Ably: Connection failed");
      setConnectionStatus("offline");
    });

    setClient(ablyClient);

    return () => {
      console.log("Ably: Cleaning up connection");
      ablyClient.close();
    };
  }, [userName]);

  const connectToPeer = useCallback(
    (peerId: string) => {
      if (!client || !peerId || peerId === myId) return;

      console.log(`Ably: Connecting to opponent's room ${peerId}`);

      // Leave our own room and join the opponent's room
      if (channelRef.current) {
        channelRef.current.presence.leave();
        channelRef.current.unsubscribe();
      }

      setRoomId(peerId);

      // Join the opponent's room channel
      const gameChannel = client.channels.get(`turbo-typer-room:${peerId}`);

      // Subscribe to player identification messages
      gameChannel.subscribe("player-joined", (message) => {
        const data = message.data;
        console.log(
          "Ably: Player joined message in opponent room",
          data,
          message.clientId
        );

        if (message.clientId && message.clientId !== userName) {
          callbacks.current.onOpponentJoined({
            id: message.clientId,
            name: data.name,
            wpm: 0,
            progress: 0,
            speed: 0,
            hasShield: false,
            score: 0,
          });
          setConnectedPeers((prev) => new Set(prev).add(message.clientId));
        }
      });

      // Subscribe to game data messages
      gameChannel.subscribe("game-data", (message) => {
        if (message.clientId && message.clientId !== userName) {
          callbacks.current.onDataReceived(message.data);
        }
      });

      // Subscribe to presence events (players entering/leaving)
      gameChannel.presence.subscribe("enter", (member) => {
        console.log(
          "Ably: Player entered opponent room",
          member.clientId,
          member.data
        );
        if (member.clientId && member.clientId !== userName) {
          callbacks.current.onOpponentJoined({
            id: member.clientId,
            name: member.data?.name || member.clientId,
            wpm: 0,
            progress: 0,
            speed: 0,
            hasShield: false,
            score: 0,
          });
          setConnectedPeers((prev) => new Set(prev).add(member.clientId));
        }
      });

      gameChannel.presence.subscribe("leave", (member) => {
        console.log("Ably: Player left opponent room", member.clientId);
        if (member.clientId) {
          setConnectedPeers((prev) => {
            const next = new Set(prev);
            next.delete(member.clientId!);
            return next;
          });
        }
      });

      // Enter presence to announce ourselves
      gameChannel.presence.enter({ name: userName }).then(() => {
        // After entering, check for existing members (the host)
        gameChannel.presence.get((err, members) => {
          if (!err && members) {
            console.log("Ably: Existing members in opponent room:", members);
            members.forEach((member) => {
              if (member.clientId && member.clientId !== userName) {
                callbacks.current.onOpponentJoined({
                  id: member.clientId,
                  name: member.data?.name || member.clientId,
                  wpm: 0,
                  progress: 0,
                  speed: 0,
                  hasShield: false,
                  score: 0,
                });
                setConnectedPeers((prev) => new Set(prev).add(member.clientId));
              }
            });
          }
        });
      });

      // Announce ourselves to the room
      gameChannel.publish("player-joined", {
        name: userName,
      });

      channelRef.current = gameChannel;
      setChannel(gameChannel);
    },
    [client, myId, userName]
  );

  const sendData = useCallback(
    (data: any) => {
      if (channel && roomId) {
        channel.publish("game-data", data);
      }
    },
    [channel, roomId]
  );

  const resetConnection = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.presence.leave();
      channelRef.current.unsubscribe();
    }
    channelRef.current = null;
    setChannel(null);
    setRoomId(null);
    setConnectedPeers(new Set());
  }, []);

  return {
    myId,
    connectionStatus,
    connectToPeer,
    sendData,
    resetConnection,
  };
};
