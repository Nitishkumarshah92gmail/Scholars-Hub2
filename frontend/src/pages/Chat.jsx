import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { HiPaperAirplane, HiOutlineChat, HiOutlineSearch, HiArrowLeft, HiDocumentText, HiTrash, HiPencil, HiCheck, HiX, HiOutlineBell, HiCamera, HiMicrophone, HiPhotograph, HiEmojiHappy, HiInformationCircle } from 'react-icons/hi';
import { deleteFile, getPresignedUrl, uploadDirect, getNotifications } from '../api';
import imageCompression from 'browser-image-compression';

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
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversations();
    
    getNotifications()
      .then((res) => setUnreadCount(res.data.unreadCount))
      .catch(() => {});
  }, []);

  useEffect(() => {
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
            setMessages((prev) => {
              // Prevent duplicate messages if optimistic UI already added it
              if (prev.some(m => m.id === newMsg.id || (m.content === newMsg.content && m.optimistic))) {
                return prev.map(m => (m.content === newMsg.content && m.optimistic) ? newMsg : m);
              }
              return [...prev, newMsg];
            });
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

      // Filter out duplicate conversations with the same user, keeping only the most recent one
      const uniqueConvosMap = new Map();
      formattedConvos.forEach(convo => {
        const existing = uniqueConvosMap.get(convo.otherUser.id);
        if (!existing || new Date(convo.updatedAt) > new Date(existing.updatedAt)) {
          uniqueConvosMap.set(convo.otherUser.id, convo);
        }
      });
      const uniqueConvos = Array.from(uniqueConvosMap.values());
      uniqueConvos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      setConversations(uniqueConvos);
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
    
    // Optimistic UI update
    const optimisticMessage = {
      id: Date.now(),
      conversation_id: activeConversation.id,
      sender_id: user._id,
      content: content,
      created_at: new Date().toISOString(),
      optimistic: true
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 50);

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
      return <span key={i} className="whitespace-pre-wrap break-all">{part}</span>;
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
      let fileToUpload = file;
      if (attachmentType === 'image') {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        try { fileToUpload = await imageCompression(file, options); } catch (err) { console.error(err); }
      }
      
      const { data: { uploadUrl, publicUrl } } = await getPresignedUrl(file.name, fileToUpload.type, 'chat');
      await uploadDirect(uploadUrl, fileToUpload);
      const fileUrl = publicUrl;
      
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
          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 mt-2 p-2 rounded-lg transition-colors ${msg.sender_id === user._id ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-100 dark:bg-ag-surface-container-high hover:bg-gray-200 dark:hover:bg-ag-surface-container-high/80'}`}>
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
    <div className="w-full h-[100vh] md:h-[calc(100vh-50px)] flex bg-ig-bg dark:bg-black rounded-none md:rounded-ag-sm border-none md:border md:border-ig-separator dark:md:border-ig-separator-dark overflow-hidden md:shadow-sm">
      
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
              className="w-full bg-gray-100 dark:bg-ag-surface-container-high text-ig-text dark:text-ig-text-light border-none rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-ag-primary transition-shadow"
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
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-ag-surface-container-high transition-colors text-left"
                  >
                    <img 
                      src={result.avatar || `https://ui-avatars.com/api/?name=${result.name}`} 
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${result.name}&background=1e3a5f&color=fbbf24`; }}
                      alt={result.name} 
                      className="w-10 h-10 rounded-full object-cover shadow-sm" 
                    />
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
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${activeConversation?.id === convo.id ? 'bg-gray-100 dark:bg-ag-surface-container-high' : 'hover:bg-gray-100 dark:hover:bg-ag-surface-container-high'}`}
                  >
                    <img 
                      src={convo.otherUser.avatar || `https://ui-avatars.com/api/?name=${convo.otherUser.name}`} 
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${convo.otherUser.name}&background=1e3a5f&color=fbbf24`; }}
                      alt={convo.otherUser.name} 
                      className="w-12 h-12 rounded-full object-cover shadow-sm" 
                    />
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
      <div className={`flex-1 flex flex-col bg-[var(--neu-bg)] ${!activeConversation ? 'hidden md:flex relative' : 'flex fixed inset-0 z-[60] md:relative md:inset-auto md:z-auto'}`}>
        {activeConversation ? (
          <div className="flex-1 flex flex-col relative pb-0 md:p-6 lg:p-10 items-center justify-center">
            {/* Liquid Background */}
            <div className="absolute top-0 left-0 w-full h-64 bg-liquid-swirl rounded-none md:rounded-b-[48px] shadow-lg pointer-events-none"></div>
            
            <div className="w-full flex-1 flex flex-col relative z-10 mx-0 mt-0 mb-0 rounded-none md:rounded-[32px] overflow-hidden md:shadow-[0_-10px_40px_rgba(0,0,0,0.05),8px_8px_20px_var(--neu-shadow-dark),-8px_-8px_20px_var(--neu-shadow-light)] bg-[var(--neu-bg)] max-w-3xl">
              {/* Chat Header */}
              <div className="px-4 py-3 flex items-center justify-between bg-[var(--neu-bg)] border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)] z-20 sticky top-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden w-8 h-8 flex items-center justify-center rounded-full text-ig-text dark:text-ig-text-light hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    <HiArrowLeft className="w-5 h-5" />
                  </button>
                  <Link to={`/dashboard/profile/${activeConversation.otherUser.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img 
                      src={activeConversation.otherUser.avatar || `https://ui-avatars.com/api/?name=${activeConversation.otherUser.name}`} 
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${activeConversation.otherUser.name}&background=1e3a5f&color=fbbf24`; }}
                      alt={activeConversation.otherUser.name} 
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-[15px] text-ig-text dark:text-ig-text-light leading-tight">{activeConversation.otherUser.name}</h3>
                      <p className="text-[12px] text-ig-text-2">Active {format(new Date(), 'h:mm a')}</p>
                    </div>
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-ig-text dark:text-ig-text-light">
                  <Link to="/dashboard/notifications" className="relative hover:opacity-70 transition-opacity">
                    <HiOutlineBell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <button className="hover:opacity-70 transition-opacity">
                    <HiInformationCircle className="w-6 h-6" />
                  </button>
                  <button onClick={() => setActiveConversation(null)} className="hidden md:flex hover:opacity-70 transition-opacity">
                     <HiX className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-ig-text-2 text-sm">
                    Say hi to {activeConversation.otherUser.name}! 👋
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.sender_id === user._id;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id} 
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group w-full min-w-0`}
                      >
                        <div className={`flex items-center gap-2 max-w-[85%] sm:max-w-[75%] min-w-0 ${isMine ? 'flex-row-reverse' : ''}`}>
                          <div 
                            className={`px-4 py-2.5 sm:px-5 sm:py-3 text-sm min-w-0 break-words ${
                              isMine 
                                ? 'bg-blue-500 text-white rounded-t-[20px] rounded-bl-[20px] rounded-br-sm shadow-[4px_4px_10px_rgba(59,130,246,0.3)]' 
                                : 'bg-[var(--neu-bg)] text-ig-text dark:text-ig-text-light rounded-t-[20px] rounded-br-[20px] rounded-bl-sm shadow-[4px_4px_10px_var(--neu-shadow-dark),-4px_-4px_10px_var(--neu-shadow-light)]'
                            }`}
                          >
                            <div className="min-w-0 overflow-hidden w-full">
                                {(!msg.attachment_url || msg.content !== ('Sent an attachment: ' + msg.attachment_name)) && (
                                  <div className="break-all whitespace-pre-wrap w-full">{renderContentWithLinks(msg.content, isMine)}</div>
                                )}
                                {renderAttachment(msg)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 bg-[var(--neu-bg)] border-t border-gray-200 dark:border-[rgba(255,255,255,0.05)]">
                <form onSubmit={sendMessage} className="flex items-end gap-2 md:gap-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    accept="image/*,video/*,audio/*,application/pdf"
                    onChange={handleFileSelect} 
                  />
                  <button
                    type="button"
                    className="w-10 h-10 mb-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors shrink-0"
                  >
                    <HiCamera className="w-6 h-6" />
                  </button>
                  <div className="flex-1 bg-gray-100 dark:bg-[#262626] rounded-[24px] px-4 py-2 flex items-end gap-2 border border-transparent focus-within:border-gray-300 dark:focus-within:border-gray-600 transition-colors">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = (e.target.scrollHeight) + 'px';
                      }}
                      placeholder="Message..."
                      className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[24px] py-1 text-[15px] text-ig-text dark:text-ig-text-light scrollbar-hide placeholder-gray-500"
                      rows="1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           sendMessage(e);
                           e.target.style.height = 'auto';
                        }
                      }}
                    />
                    {!newMessage.trim() && !isUploading ? (
                      <div className="flex items-center gap-3 text-ig-text dark:text-ig-text-light mb-1 opacity-80">
                        <button type="button" className="hover:opacity-70 transition-opacity">
                          <HiMicrophone className="w-6 h-6" />
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="hover:opacity-70 transition-opacity">
                          <HiPhotograph className="w-6 h-6" />
                        </button>
                        <button type="button" className="hover:opacity-70 transition-opacity hidden sm:block">
                          <HiEmojiHappy className="w-6 h-6" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={isUploading}
                        className="mb-1 font-semibold text-blue-500 hover:text-blue-600 disabled:opacity-50 transition-colors px-2"
                      >
                        {isUploading ? (
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Send"
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-ig-text-2 bg-[var(--neu-bg)]">
            <div className="w-24 h-24 rounded-full border-2 border-ig-text-2/20 flex items-center justify-center mb-4 shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]">
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
