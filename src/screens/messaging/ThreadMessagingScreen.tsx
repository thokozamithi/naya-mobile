import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useThreads, useThreadMessages, useSendThreadMessage } from '@/hooks/useData';
import { formatTime } from '@/lib/utils';

interface RouteParams {
  threadId?: string;
}

export default function ThreadMessagingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = useAuth();
  const { threadId } = (route.params as RouteParams) || {};

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(threadId || null);
  const [messageBody, setMessageBody] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: threads = [], isLoading, refetch } = useThreads();
  const {
    data: threadMessages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useThreadMessages(selectedThreadId);
  const sendThreadMessage = useSendThreadMessage();

  useEffect(() => {
    if (threadId) {
      setSelectedThreadId(threadId);
    }
  }, [threadId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchMessages()]);
    setRefreshing(false);
  }, [refetch, refetchMessages]);

  const sortedThreads = useMemo(() => {
    return [...threads].sort((a: any, b: any) => {
      const aTime = a.lastMessage?.created_at || a.last_message_at || a.created_at;
      const bTime = b.lastMessage?.created_at || b.last_message_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [threads]);

  const handleSend = async () => {
    if (!messageBody.trim() || !selectedThreadId) return;

    try {
      await sendThreadMessage.mutateAsync({
        threadId: selectedThreadId,
        body: messageBody.trim(),
      });
      setMessageBody('');
    } catch (error) {
      console.error('Error sending thread message:', error);
    }
  };

  const renderThreadItem = useCallback(({ item }: { item: any }) => {
    const title = item.subject || `Thread ${item.id.slice(0, 6).toUpperCase()}`;
    const preview = item.lastMessage?.body || 'No messages yet';
    const time = item.lastMessage?.created_at || item.last_message_at || item.created_at;

    return (
      <TouchableOpacity
        style={styles.threadItem}
        onPress={() => setSelectedThreadId(item.id)}
      >
        <View style={styles.threadAvatar}>
          <Text style={styles.threadAvatarText}>{title.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text style={styles.threadTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.threadTime}>{formatTime(time)}</Text>
          </View>
          <Text style={styles.threadPreview} numberOfLines={1}>{preview}</Text>
        </View>
      </TouchableOpacity>
    );
  }, []);

  const renderMessageItem = useCallback(({ item }: { item: any }) => {
    const isOwn = item.sender_id === user?.id;
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        <View style={[styles.messageBubble, isOwn && styles.messageBubbleOwn]}>
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{item.body}</Text>
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  }, [user?.id]);

  if (!user?.id) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view team messages</Text>
      </View>
    );
  }

  if (selectedThreadId) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedThreadId(null)}>
              <Text style={styles.backButton}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Team Thread</Text>
            <View style={{ width: 50 }} />
          </View>

          {messagesLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <FlatList
              data={threadMessages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              contentContainerStyle={styles.messagesList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
              }
            />
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={messageBody}
              onChangeText={setMessageBody}
              multiline
              editable={!sendThreadMessage.isPending}
            />
            <TouchableOpacity
              style={[styles.sendButton, sendThreadMessage.isPending && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={sendThreadMessage.isPending || !messageBody.trim()}
            >
              {sendThreadMessage.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Messages</Text>
        <View style={{ width: 50 }} />
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : sortedThreads.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
          <Text style={styles.emptyStateTitle}>No team threads yet</Text>
          <Text style={styles.emptyStateText}>
            Start a conversation from a project or specialist profile.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedThreads}
          keyExtractor={(item) => item.id}
          renderItem={renderThreadItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  backButton: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  errorText: { fontSize: 16, color: '#d32f2f', textAlign: 'center', marginTop: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyStateTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 4 },
  emptyStateText: { fontSize: 14, color: '#999', textAlign: 'center' },
  threadItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  threadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5AC8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  threadAvatarText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  threadContent: { flex: 1 },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  threadTitle: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1, marginRight: 8 },
  threadTime: { fontSize: 12, color: '#999' },
  threadPreview: { fontSize: 14, color: '#666' },
  messagesList: { padding: 12, flexGrow: 1 },
  messageRow: { marginBottom: 12, flexDirection: 'row', justifyContent: 'flex-start' },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageBubble: {
    maxWidth: '80%',
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleOwn: { backgroundColor: '#007AFF' },
  messageText: { fontSize: 16, color: '#000' },
  messageTextOwn: { color: '#fff' },
  messageTime: { fontSize: 11, color: '#999', marginTop: 4 },
  messageTimeOwn: { color: 'rgba(255,255,255,0.7)' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
