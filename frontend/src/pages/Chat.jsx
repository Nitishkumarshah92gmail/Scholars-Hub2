import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { HiPaperAirplane, HiOutlineChat, HiOutlineSearch, HiArrowLeft, HiPaperClip, HiDocumentText, HiTrash, HiPencil, HiCheck, HiX } from 'react-icons/hi';
import { uploadFiles, deleteFile } from '../api';

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          // If message belongs to active conversation, add to messages list
          if (activeConversation && newMsg.conversation_id === activeConversation.id) {
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
          }
          // Also refresh conversations list to update 'latest message' and sorting
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const { data: convos, error: convoError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations (id, updated_at)
        `)
        .eq('user_id', user._id);

      if (convoError) throw convoError;

      // Extract unique conversation IDs
      const convoIds = convos.map(c => c.conversation_id);
      
      if (convoIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Fetch details of the *other* participant for each conversation
      const { data: othersData, error: othersError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          profiles:user_id (id, name, avatar, school)
        `)
        .in('conversation_id', convoIds)
        .neq('user_id', user._id);

      if (othersError) throw othersError;

      // Fetch the latest message for each conversation
      const { data: latestMessages, error: msgError } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', convoIds)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      // Map everything together
      const formattedConvos = othersData.map(other => {
        const latestMsg = latestMessages.find(m => m.conversation_id === other.conversation_id);
        return {
          id: other.conversation_id,
          otherUser: other.profiles,
          latestMessage: latestMsg?.content || 'No messages yet',
          updatedAt: latestMsg?.created_at || new Date().toISOString()
        };
      });

      // Sort by latest activity
      formattedConvos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      setConversations(formattedConvos);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (error.message) toast.error('Failed to load chats: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data);
      
      // Mark as read (simplified)
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user._id);
        
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar, school')
        .ilike('name', `%${query}%`)
        .neq('id', user._id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
      if (error.message) toast.error('Search failed: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const startConversation = async (targetUser) => {
    try {
      // Check if conversation already exists
      const existingConvo = conversations.find(c => c.otherUser.id === targetUser.id);
      
      if (existingConvo) {
        setActiveConversation(existingConvo);
        setSearchQuery('');
        setSearchResults([]);
        return;
      }

      // Generate UUID client-side to avoid RLS select restrictions during insert
      const newConvoId = crypto.randomUUID();
      
      // Create new conversation
      const { error: convoError } = await supabase
        .from('conversations')
        .insert([{ id: newConvoId }]);

      if (convoError) throw convoError;

      // Add participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConvoId, user_id: user._id },
          { conversation_id: newConvoId, user_id: targetUser.id }
        ]);

      if (partError) throw partError;

      const newConvoObj = {
        id: newConvoId,
        otherUser: targetUser,
        latestMessage: 'Start a conversation!',
        updatedAt: new Date().toISOString()
      };

      setConversations([newConvoObj, ...conversations]);
      setActiveConversation(newConvoObj);
      setSearchQuery('');
      setSearchResults([]);
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Could not start chat: ' + error.message);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const content = newMessage.trim();
    setNewMessage(''); // optimistic clear

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: activeConversation.id,
          sender_id: user._id,
          content: content
        }]);

      if (error) throw error;
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversation.id);
        
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Could not send: ' + error.message);
      setNewMessage(content); // restore on error
    }
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      // Find the message to get attachment URL
      const msgToDelete = messages.find(m => m.id === msgId);

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', msgId)
        .eq('sender_id', user._id); // Ensure only sender can delete

      if (error) throw error;
      
      setMessages(prev => prev.filter(m => m.id !== msgId));
      toast.success('Message deleted');

      // Attempt to delete physical file from storage if it exists
      if (msgToDelete?.attachment_url) {
        const fileId = msgToDelete.attachment_url.split('/').pop().split('?')[0];
        try {
          await deleteFile(fileId);
        } catch (err) {
          console.warn('Could not delete attachment file:', err);
        }
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Failed to delete message: ' + err.message);
    }
  };

  const handleEditMessage = async (msgId) => {
    if (!editContent.trim()) return;
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: editContent.trim() })
        .eq('id', msgId)
        .eq('sender_id', user._id);
        
      if (error) throw error;
      
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editContent.trim() } : m));
      toast.success('Message updated');
      setEditingMessageId(null);
      setEditContent('');
    } catch (err) {
      console.error('Error editing message:', err);
      toast.error('Failed to edit: ' + err.message);
    }
  };

  const renderContentWithLinks = (text, isMine) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={`underline font-semibold hover:opacity-80 transition-opacity break-all ${isMine ? 'text-white' : 'text-ig-primary'}`}>
            {part}
          </a>
        );
      }
      return <span key={i} className="whitespace-pre-wrap break-words">{part}</span>;
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setIsUploading(true);
    
    // Determine attachment type
    let attachmentType = 'file';
    if (file.type.startsWith('image/')) attachmentType = 'image';
    else if (file.type.startsWith('video/')) attachmentType = 'video';
    else if (file.type.startsWith('audio/')) attachmentType = 'audio';
    else if (file.type === 'application/pdf') attachmentType = 'pdf';
    else {
      toast.error('Unsupported file type. Only images, videos, audio, and PDFs are allowed.');
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('subfolder', 'chat');
      
      const res = await uploadFiles(formData);
      const fileUrl = res.data.urls[0].fileUrl;
      
      // Send message with attachment
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: activeConversation.id,
          sender_id: user._id,
          content: 'Sent an attachment: ' + file.name,
          attachment_url: fileUrl,
          attachment_type: attachmentType,
          attachment_name: file.name
        }]);
        
      if (error) throw error;
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversation.id);
        
    } catch (error) {
      console.error('Error uploading attachment:', error);
      toast.error('Failed to upload attachment: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderAttachment = (msg) => {
    if (!msg.attachment_url) return null;
    
    switch (msg.attachment_type) {
      case 'image':
        return (
          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
            <img src={msg.attachment_url} alt={msg.attachment_name} className="max-w-full rounded-lg max-h-64 object-cover" />
          </a>
        );
      case 'video':
        return <video src={msg.attachment_url} controls className="max-w-full rounded-lg mt-2 max-h-64" />;
      case 'audio':
        return <audio src={msg.attachment_url} controls className="w-full mt-2 max-w-[200px]" />;
      case 'pdf':
        return (
          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 mt-2 p-2 rounded-lg transition-colors ${msg.sender_id === user._id ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-100 dark:bg-ig-bg-elevated hover:bg-gray-200 dark:hover:bg-ig-bg-elevated/80'}`}>
            <HiDocumentText className={`w-8 h-8 ${msg.sender_id === user._id ? 'text-white' : 'text-red-500'}`} />
            <span className="text-sm font-semibold truncate max-w-[150px]">{msg.attachment_name}</span>
          </a>
        );
      default:
        return (
          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="underline mt-2 inline-block text-sm">Download Attachment</a>
        );
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-50px)] flex bg-ig-bg dark:bg-ig-bg-dark rounded-xl border border-ig-separator dark:border-ig-separator-dark overflow-hidden shadow-sm">
      
      {/* Sidebar - Conversation List */}
      <div className={`w-full md:w-80 border-r border-ig-separator dark:border-ig-separator-dark flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-ig-separator dark:border-ig-separator-dark">
          <h2 className="text-xl font-bold text-ig-text dark:text-ig-text-light mb-4">Messages</h2>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiOutlineSearch className="text-ig-text-2" />
            </div>
            <input
              type="text"
              className="w-full bg-gray-100 dark:bg-ig-bg-elevated text-ig-text dark:text-ig-text-light border-none rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-ig-primary transition-shadow"
              placeholder="Search scholars..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {searchQuery.length >= 2 ? (
            <div className="p-2 space-y-1">
              <p className="px-2 text-xs font-semibold text-ig-text-2 uppercase tracking-wider mb-2">Search Results</p>
              {isSearching ? (
                <p className="p-4 text-center text-ig-text-2 text-sm">Searching...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map(result => (
                  <button
                    key={result.id}
                    onClick={() => startConversation(result)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-ig-bg-elevated transition-colors text-left"
                  >
                    <img src={result.avatar || `https://ui-avatars.com/api/?name=${result.name}`} alt={result.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-sm text-ig-text dark:text-ig-text-light">{result.name}</p>
                      <p className="text-xs text-ig-text-2 truncate">{result.school}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="p-4 text-center text-ig-text-2 text-sm">No scholars found</p>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-ig-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : conversations.length > 0 ? (
                conversations.map(convo => (
                  <button
                    key={convo.id}
                    onClick={() => setActiveConversation(convo)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${activeConversation?.id === convo.id ? 'bg-gray-100 dark:bg-ig-bg-elevated' : 'hover:bg-gray-100 dark:hover:bg-ig-bg-elevated'}`}
                  >
                    <img src={convo.otherUser.avatar || `https://ui-avatars.com/api/?name=${convo.otherUser.name}`} alt={convo.otherUser.name} className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="font-semibold text-sm text-ig-text dark:text-ig-text-light truncate">{convo.otherUser.name}</p>
                        <span className="text-[10px] text-ig-text-2 whitespace-nowrap ml-2">
                          {format(new Date(convo.updatedAt), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-xs text-ig-text-2 truncate">{convo.latestMessage}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 flex flex-col items-center text-center text-ig-text-2">
                  <HiOutlineChat className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No conversations yet.</p>
                  <p className="text-xs mt-1">Search for a scholar above to start chatting!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-ig-bg-dark ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-ig-separator dark:border-ig-separator-dark flex items-center gap-3 bg-white/80 dark:bg-ig-bg-dark/80 backdrop-blur-md sticky top-0 z-10">
              <button 
                onClick={() => setActiveConversation(null)}
                className="md:hidden p-2 -ml-2 rounded-full text-ig-text dark:text-ig-text-light hover:bg-gray-100 dark:hover:bg-ig-bg-elevated"
              >
                <HiArrowLeft className="w-5 h-5" />
              </button>
              <img 
                src={activeConversation.otherUser.avatar || `https://ui-avatars.com/api/?name=${activeConversation.otherUser.name}`} 
                alt={activeConversation.otherUser.name} 
                className="w-10 h-10 rounded-full object-cover border border-ig-separator/20" 
              />
              <div>
                <h3 className="font-bold text-ig-text dark:text-ig-text-light">{activeConversation.otherUser.name}</h3>
                <p className="text-xs text-ig-text-2">{activeConversation.otherUser.school}</p>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a]">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-ig-text-2 text-sm">
                  Say hi to {activeConversation.otherUser.name}! 👋
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.sender_id === user._id;
                  const showTime = idx === 0 || new Date(msg.created_at) - new Date(messages[idx-1].created_at) > 300000;
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg.id} 
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}
                    >
                      {showTime && (
                        <span className="text-[10px] text-ig-text-2 mb-2 mt-4">
                          {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                      <div className="flex items-center gap-2 max-w-[85%]">
                        {isMine && (
                          <div className="flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditContent(msg.content);
                              }}
                              className="p-2 text-ig-text-2 hover:text-ig-primary rounded-full hover:bg-gray-100 dark:hover:bg-ig-bg-elevated"
                              title="Edit message"
                            >
                              <HiPencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="p-2 text-ig-error rounded-full hover:bg-gray-100 dark:hover:bg-ig-bg-elevated"
                              title="Delete message"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div 
                          className={`px-4 py-2 rounded-2xl text-sm ${
                            isMine 
                              ? 'bg-gradient-to-r from-ig-primary to-blue-500 text-white rounded-br-sm shadow-sm' 
                              : 'bg-white dark:bg-ig-bg-elevated text-ig-text dark:text-ig-text-light border border-ig-separator/50 dark:border-ig-separator-dark/50 rounded-bl-sm shadow-sm'
                          }`}
                        >
                          {editingMessageId === msg.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                value={editContent} 
                                onChange={(e) => setEditContent(e.target.value)}
                                className="text-ig-text dark:text-ig-text-light bg-white dark:bg-ig-bg-dark px-2 py-1 rounded border-none focus:ring-1 focus:ring-ig-primary text-sm min-w-[150px]"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditMessage(msg.id);
                                  if (e.key === 'Escape') setEditingMessageId(null);
                                }}
                                autoFocus
                              />
                              <button onClick={() => handleEditMessage(msg.id)} className="p-1 hover:bg-white/20 rounded-full" title="Save">
                                <HiCheck className="w-4 h-4 text-white" />
                              </button>
                              <button onClick={() => setEditingMessageId(null)} className="p-1 hover:bg-white/20 rounded-full" title="Cancel">
                                <HiX className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {(!msg.attachment_url || msg.content !== ('Sent an attachment: ' + msg.attachment_name)) && (
                                <div>{renderContentWithLinks(msg.content, isMine)}</div>
                              )}
                              {renderAttachment(msg)}
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 bg-white dark:bg-ig-bg-dark border-t border-ig-separator dark:border-ig-separator-dark">
              <form onSubmit={sendMessage} className="flex items-end gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  hidden 
                  accept="image/*,video/*,audio/*,application/pdf"
                  onChange={handleFileSelect} 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-3 bg-gray-100 dark:bg-ig-bg-elevated hover:bg-gray-200 dark:hover:bg-ig-separator-dark rounded-full text-ig-text dark:text-ig-text-light transition-colors shrink-0"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-ig-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <HiPaperClip className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 bg-gray-100 dark:bg-ig-bg-elevated rounded-3xl p-1 flex items-center border border-transparent focus-within:border-ig-primary/30 transition-colors">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[40px] px-4 py-2 text-sm text-ig-text dark:text-ig-text-light scrollbar-hide"
                    rows="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 bg-ig-primary hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-ig-primary rounded-full text-white transition-colors"
                >
                  <HiPaperAirplane className="w-5 h-5 rotate-90" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-ig-text-2">
            <div className="w-24 h-24 rounded-full border-2 border-ig-text-2/20 flex items-center justify-center mb-4">
              <HiOutlineChat className="w-10 h-10 opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-ig-text dark:text-ig-text-light mb-2">Your Messages</h3>
            <p className="text-sm">Send private messages to other scholars.</p>
          </div>
        )}
      </div>
    </div>
  );
}
