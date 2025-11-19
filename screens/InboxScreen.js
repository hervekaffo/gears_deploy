import React, { useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MessagesContext } from '../store/messages-context';
import { AuthContext } from '../store/auth-context';
import { GlobalStyles } from '../constants/styles';

function formatRelative(date) {
  if (!date) return '';
  const now = Date.now();
  const diff = now - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'Just now';
  if (diff < hour) {
    const mins = Math.floor(diff / minute);
    return `${mins} min${mins === 1 ? '' : 's'} ago`;
  }
  if (diff < day) {
    const hrs = Math.floor(diff / hour);
    return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  }
  return date.toLocaleDateString();
}

export default function InboxScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { threads } = useContext(MessagesContext);

  const data = useMemo(() => threads, [threads]);

  function renderItem({ item }) {
    const members = Object.values(item.members || {});
    const partner = members.find(member => member.uid !== user?.uid) || members[0] || {};
    const booking = item.booking;
    const headline = booking?.vehicleTitle || item.name || 'Trip chat';
    const last = item.lastMessage;
    const lastPreview = last
      ? `${last.senderId === user?.uid ? 'You' : partner?.displayName || 'Guest'}: ${last.text}`
      : 'No messages yet';
    const timestamp = last?.createdAt || item.createdAt;

    return (
      <TouchableOpacity
        style={styles.threadCard}
        onPress={() =>
          navigation.navigate('ChatThread', { threadId: item.id })
        }
      >
        <View style={styles.avatar}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={GlobalStyles.colors.primary500} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.threadHeader}>
            <Text style={styles.threadTitle} numberOfLines={1}>
              {headline}
            </Text>
            <Text style={styles.threadTime}>{formatRelative(timestamp)}</Text>
          </View>
          <Text style={styles.threadMeta} numberOfLines={1}>
            {partner?.displayName || 'Guest'}
          </Text>
          <Text style={styles.threadPreview} numberOfLines={1}>
            {lastPreview}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={GlobalStyles.colors.gray400}
        />
      </TouchableOpacity>
    );
  }

  if (!data.length) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={GlobalStyles.colors.primary500} />
        </View>
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptyBody}>
          Message your host after booking to coordinate pickup, delivery, and more.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>Inbox</Text>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.primary50,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: GlobalStyles.colors.gray800,
    marginBottom: 16,
  },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GlobalStyles.colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threadTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: GlobalStyles.colors.gray900,
    marginRight: 12,
  },
  threadTime: {
    fontSize: 12,
    color: GlobalStyles.colors.gray500,
  },
  threadMeta: {
    marginTop: 4,
    fontSize: 13,
    color: GlobalStyles.colors.gray600,
  },
  threadPreview: {
    marginTop: 4,
    fontSize: 13,
    color: GlobalStyles.colors.gray500,
  },
  separator: {
    height: 1,
    backgroundColor: GlobalStyles.colors.border,
  },
  emptyState: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GlobalStyles.colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GlobalStyles.colors.gray800,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    color: GlobalStyles.colors.gray600,
    textAlign: 'center',
  },
});
