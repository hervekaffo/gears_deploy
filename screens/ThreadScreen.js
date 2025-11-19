import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MessagesContext } from '../store/messages-context';
import { AuthContext } from '../store/auth-context';
import { GlobalStyles } from '../constants/styles';

function formatTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDates(booking) {
  if (!booking?.start || !booking?.end) return null;
  const start = new Date(booking.start).toLocaleDateString();
  const end = new Date(booking.end).toLocaleDateString();
  return `${start} -> ${end}`;
}

export default function ThreadScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { threadId } = route.params || {};

  const { user } = useContext(AuthContext);
  const { threads, messagesByThread, observeThread, sendMessage } =
    useContext(MessagesContext);

  const thread = useMemo(
    () => threads.find(item => item.id === threadId),
    [threads, threadId]
  );
  const partner = useMemo(() => {
    if (!thread?.members) return null;
    const members = Object.values(thread.members);
    return members.find(member => member.uid !== user?.uid) || members[0] || null;
  }, [thread, user?.uid]);
  const booking = thread?.booking;
  const messages = messagesByThread[threadId] || [];

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: partner?.displayName || thread?.name || 'Conversation',
    });
  }, [navigation, partner?.displayName, thread?.name]);

  useEffect(() => {
    if (!threadId) return undefined;
    return observeThread(threadId);
  }, [threadId, observeThread]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || !threadId || sending) return;
    try {
      setInput('');
      setSending(true);
      await sendMessage(threadId, trimmed);
    } catch (err) {
      if (__DEV__) {
        console.warn('sendMessage failed', err?.code || err?.message || err);
      }
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item }) {
    const isMine = item.senderId === user?.uid;
    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.messageRowMine : styles.messageRowTheirs,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.bubbleTime,
              isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  }

  if (!threadId) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Conversation not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={styles.detailsBanner}>
        <Text style={styles.bannerTitle}>
          {booking?.vehicleTitle || thread?.name || 'Trip chat'}
        </Text>
        {partner?.displayName ? (
          <Text style={styles.bannerSubtitle}>With {partner.displayName}</Text>
        ) : null}
        {formatDates(booking) ? (
          <Text style={styles.bannerSubtitle}>{formatDates(booking)}</Text>
        ) : null}
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContainer}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={32}
                  color={GlobalStyles.colors.primary400}
                  style={{ marginBottom: 12 }}
                />
                <Text style={styles.emptyMessagesText}>
                  Say hello and coordinate the details of your trip.
                </Text>
              </View>
            }
          />
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Write a message"
          style={styles.input}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.primary50,
  },
  detailsBanner: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: GlobalStyles.colors.border,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GlobalStyles.colors.gray800,
  },
  bannerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: GlobalStyles.colors.gray600,
  },
  messagesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: GlobalStyles.colors.primary500,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  bubbleTextTheirs: {
    color: GlobalStyles.colors.gray800,
  },
  bubbleTime: {
    marginTop: 6,
    fontSize: 11,
    textAlign: 'right',
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  bubbleTimeTheirs: {
    color: GlobalStyles.colors.gray500,
  },
  composer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: GlobalStyles.colors.border,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: GlobalStyles.colors.primary100,
    borderRadius: 18,
    marginRight: 12,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GlobalStyles.colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GlobalStyles.colors.primary50,
  },
  emptyText: {
    color: GlobalStyles.colors.gray600,
  },
  emptyMessages: {
    alignItems: 'center',
    marginTop: 48,
    paddingHorizontal: 32,
  },
  emptyMessagesText: {
    textAlign: 'center',
    color: GlobalStyles.colors.gray600,
  },
});
