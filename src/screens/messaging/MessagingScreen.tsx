import { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useData';
import { supabase } from '@/services/supabase';
import { formatTime } from '@/lib/utils';
import { DashboardHeader } from '@/components/DashboardHeader';

export default function MessagingScreen({ navigation }: any) {
  const { user, signOut, activeRole } = useAuth();
  const { data: messages = [], isLoading, refetch } = useMessages(user?.id);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Memoize conversation grouping to avoid recalculating on every render
  const conversations = useMemo(() => {
    if (!user?.id) return [];

    const grouped = messages.reduce((acc: any[], message: any) => {
      const otherUserId =
        message.sender_id === user.id ? message.receiver_id : message.sender_id;
      const existing = acc.find((c: any) => c.otherUserId === otherUserId);

      if (existing) {
        existing.messages.push(message);
        if (new Date(message.created_at) > new Date(existing.lastMessage.created_at)) {
          existing.lastMessage = message;
        }
      } else {
        acc.push({
          otherUserId,
          messages: [message],
          lastMessage: message,
        });
      }

      return acc;
    }, []);

    grouped.sort(
      (a: any, b: any) =>
        new Date(b.lastMessage.created_at).getTime() -
        new Date(a.lastMessage.created_at).getTime()
    );

    return grouped;
  }, [messages, user?.id]);

  // Memoize selected conversation messages
  const selectedConvMessages = useMemo(() => {
    if (!selectedConversation) return [];
    const conv = conversations.find((c: any) => c.otherUserId === selectedConversation);
    if (!conv) return [];
    return [...conv.messages].sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [conversations, selectedConversation]);

  // Navigation handlers for header
  const handleLogoPress = () => navigation?.navigate?.('Home');
  const handleRoleSwitch = () => navigation?.navigate?.('RoleSelection');
  const handleSignOut = () => { if (typeof signOut === 'function') { signOut(); } navigation?.navigate?.('Home'); };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view messages</Text>
      </View>
    );
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedConversation,
        content: newMessage,
      });
      setNewMessage('');
      refetch();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = useCallback(({ item }: { item: any }) => {
    const isOwn = item.sender_id === user!.id;
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        <View style={[styles.messageBubble, isOwn && styles.messageBubbleOwn]}>
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  }, [user]);

  const renderConversationItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => setSelectedConversation(item.otherUserId)}
    >
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {item.otherUserId.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {item.otherUserId.slice(0, 8)}...
          </Text>
          <Text style={styles.conversationTime}>
            {formatTime(item.lastMessage.created_at)}
          </Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage.sender_id === user!.id ? 'You: ' : ''}
          {item.lastMessage.content}
        </Text>
      </View>
    </TouchableOpacity>
  ), [user]);

  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedConversation(null)}>
              <Text style={styles.backButton}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chat</Text>
            <View style={{ width: 50 }} />
          </View>

          <FlatList
            data={selectedConvMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
            }
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={sending || !newMessage.trim()}
            >
              {sending ? (
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonItem}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonContent}>
              <View style={[styles.skeletonLine, { width: '60%' }]} />
              <View style={[styles.skeletonLine, { width: '80%', marginTop: 6 }]} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <>
      <DashboardHeader
        onLogoPress={handleLogoPress}
        onRoleSwitch={handleRoleSwitch}
        onSignOut={handleSignOut}
        userName={user?.email}
        role={activeRole}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
            <Text style={styles.emptyStateTitle}>No messages yet</Text>
            <Text style={styles.emptyStateText}>
              Start a conversation by contacting a specialist
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.otherUserId}
            renderItem={renderConversationItem}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  messagesList: {
    padding: 12,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleOwn: {
    backgroundColor: '#007AFF',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
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
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Skeleton loading
  skeletonItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
});
