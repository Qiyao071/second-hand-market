<template>
  <div class="messages-page">
    <div class="messages-container">
      <div class="conversation-list">
        <h3>消息列表</h3>
        <div class="conversation-items">
          <div 
          v-for="conversation in conversations" 
          :key="conversation._id"
          @click="selectConversation(conversation)"
          :class="['conversation-item', { active: selectedConversation?._id === conversation._id, 'system': conversation.isSystem }]"
        >
          <img 
            :src="conversation.isSystem ? 'https://api.dicebear.com/7.x/bottts/svg?seed=system' : (conversation.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + conversation._id)" 
            :alt="conversation.userName"
            class="avatar"
          >
          <div class="conversation-info">
            <span class="user-name">{{ conversation.isSystem ? '系统通知' : conversation.userName }}</span>
            <span class="last-message">{{ conversation.lastMessage.content }}</span>
          </div>
            <div class="conversation-meta">
              <span class="time">{{ formatTime(conversation.lastMessage.createdAt) }}</span>
              <span v-if="conversation.unreadCount > 0" class="unread-count">{{ conversation.unreadCount }}</span>
            </div>
            <button 
              @click.stop="deleteConversation(conversation._id)" 
              class="delete-conversation-btn"
              title="删除聊天记录"
            >
              <span class="delete-icon">×</span>
            </button>
          </div>
          <div v-if="conversations.length === 0" class="empty-state">
            <p>暂无消息</p>
          </div>
        </div>
      </div>

      <div class="chat-area">
        <div v-if="selectedConversation" class="chat-header">
          <img 
            :src="selectedConversation.isSystem ? 'https://api.dicebear.com/7.x/bottts/svg?seed=system' : (selectedConversation.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + selectedConversation._id)" 
            :alt="selectedConversation.userName"
            class="avatar"
          >
          <span class="user-name">{{ selectedConversation.userName }}</span>
        </div>

        <div v-else class="chat-placeholder">
          <p>选择一个会话开始聊天</p>
        </div>

        <div v-if="selectedConversation" class="messages-list">
          <div 
            v-for="message in currentMessages" 
            :key="message._id"
            :class="['message-item', { sent: isSentMessage(message), revoked: message.isRevoked }]"
          >
            <div class="message-content">
              <span v-if="message.isRevoked" class="revoked-text">[消息已撤回]</span>
              
              <!-- 交易请求反馈消息 -->
              <div v-else-if="message.isTradeRequest && message.tradeFeedback" :class="['trade-feedback-card', message.tradeStatus]">
                <div class="trade-feedback-icon">
                  <span v-if="message.tradeStatus === 'accepted'">✓</span>
                  <span v-else-if="message.tradeStatus === 'rejected'">✗</span>
                </div>
                <div class="trade-feedback-content">
                  <p class="trade-feedback-title">{{ message.tradeStatus === 'accepted' ? '交易请求已同意' : '交易请求已拒绝' }}</p>
                  <p class="trade-feedback-desc">{{ message.tradeStatus === 'accepted' ? '对方接受了您的交易请求' : '对方拒绝了您的交易请求' }}</p>
                </div>
              </div>
              
              <!-- 交易请求卡片 -->
              <div v-else-if="message.isTradeRequest" class="trade-request-card">
                <div class="trade-request-header">
                  <span class="trade-tag">交易请求</span>
                  <span v-if="message.tradeStatus" :class="['status-tag', message.tradeStatus]">
                    {{ getTradeStatusText(message.tradeStatus) }}
                  </span>
                </div>
                <div class="trade-request-content">
                  <img v-if="message.image" :src="message.image" alt="商品图片" class="trade-item-image">
                  <div class="trade-item-info">
                    <p class="trade-message">{{ message.content }}</p>
                    <div class="trade-actions">
                      <button 
                        v-if="!isSentMessage(message) && message.tradeStatus === 'pending'" 
                        @click="acceptTradeRequest(message._id)" 
                        class="trade-action-btn accept-btn"
                      >
                        ✓ 同意
                      </button>
                      <button 
                        v-if="!isSentMessage(message) && message.tradeStatus === 'pending'" 
                        @click="rejectTradeRequest(message._id)" 
                        class="trade-action-btn reject-btn"
                      >
                        ✗ 拒绝
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 普通消息 -->
              <div v-else>
                <p v-if="message.content" class="text-content">{{ message.content }}</p>
                <img v-if="message.image" :src="message.image" alt="图片消息" class="message-image" @click="previewImage(message.image)">
              </div>
            </div>
            <div class="message-footer">
              <span class="message-time">{{ formatTime(message.createdAt) }}</span>
              <button 
                v-if="isSentMessage(message) && !message.isRevoked && canRevoke(message)" 
                @click="revokeMessage(message._id)" 
                class="revoke-btn"
              >
                撤回
              </button>
            </div>
          </div>
          <div ref="messagesEnd" class="scroll-bottom"></div>
        </div>

        <div v-if="selectedConversation && showQuickMessages" class="quick-messages">
          <div class="quick-messages-title">快捷消息</div>
          <div class="quick-messages-list">
            <button 
              v-for="(template, index) in quickMessageTemplates" 
              :key="index"
              @click="useQuickMessage(template)"
              class="quick-message-btn"
            >
              {{ template.replace('{itemTitle}', itemInfo?.itemTitle || '物品') }}
            </button>
          </div>
        </div>

        <div v-if="selectedConversation && !isSystemConversation" class="chat-input-area">
          <input 
            ref="imageInput"
            type="file" 
            accept="image/*" 
            multiple
            @change="handleImageUpload" 
            style="display: none"
          >
          <button @click="$refs.imageInput.click()" class="image-btn" title="发送图片">
            📷
          </button>
          <input 
            v-model="newMessage" 
            @keyup.enter="sendMessage"
            placeholder="输入消息..."
            class="message-input"
          >
          <button @click="sendMessage" class="send-btn">发送</button>
          <button @click="openTradeModal" class="trade-btn" title="发起交易">
            🤝 发起交易
          </button>
        </div>
        
        <!-- 图片预览 -->
        <div v-if="previewImageUrls.length > 0" class="image-preview">
          <div class="preview-header">
            <span>已选择 {{ previewImageUrls.length }} 张图片</span>
            <button @click="cancelImagePreview" class="cancel-preview-btn">取消</button>
          </div>
          <div class="preview-images">
            <div 
              v-for="(imageUrl, index) in previewImageUrls" 
              :key="index" 
              class="preview-item"
            >
              <img :src="imageUrl" :alt="`图片 ${index + 1}`" @click="previewImage(imageUrl)">
              <button @click="removePreviewImage(index)" class="remove-image-btn">×</button>
            </div>
          </div>
        </div>
        
        <!-- 图片查看器 -->
        <div v-if="showImageViewer" class="image-viewer" @click="closeImageViewer">
          <img :src="viewerImageUrl" alt="查看图片" @click.stop>
        </div>
        
        <!-- 交易请求模态框 -->
        <div v-if="showTradeModal" class="modal-overlay" @click="closeTradeModal">
          <div class="modal-content trade-modal" @click.stop>
            <div class="modal-header">
              <h3>发起交易请求</h3>
              <button @click="closeTradeModal" class="close-btn">×</button>
            </div>
            <div class="modal-body">
              <p class="trade-info">选择您想要交易的商品：</p>
              <div v-if="myItems.length === 0" class="empty-state">
                <p>对方还没有发布任何商品</p>
              </div>
              <div v-else class="items-grid">
                <div 
                  v-for="item in myItems" 
                  :key="item._id"
                  @click="selectTradeItem(item)"
                  :class="['item-card', { selected: selectedTradeItem?._id === item._id }]"
                >
                  <img :src="item.images[0] || 'https://api.dicebear.com/7.x/avataaars/svg?seed=item'" :alt="item.title" class="item-image">
                  <div class="item-info">
                    <h4 class="item-title">{{ item.title }}</h4>
                    <p class="item-price">¥{{ item.price }}</p>
                    <span :class="['status-badge', item.status]">{{ getItemStatus(item.status) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button @click="closeTradeModal" class="cancel-btn">取消</button>
              <button @click="submitTradeRequest" :disabled="!selectedTradeItem" class="submit-btn" :class="{ disabled: !selectedTradeItem }">
                发送交易请求
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const conversations = ref([])
const selectedConversation = ref(null)
const currentMessages = ref([])
const newMessage = ref('')
const messagesEnd = ref(null)
const showQuickMessages = ref(false)
const itemInfo = ref(null)
const isSystemConversation = ref(false)
const previewImageUrls = ref([])
const showImageViewer = ref(false)
const viewerImageUrl = ref('')
const imageInput = ref(null)
const showTradeModal = ref(false)
const myItems = ref([])
const selectedTradeItem = ref(null)
let messagePollingInterval = null

const quickMessageTemplates = [
  '您好，我对您发布的「{itemTitle}」感兴趣',
  '请问「{itemTitle}」还在吗？',
  '您好，请问「{itemTitle}」最低多少钱出？',
  '我想了解一下「{itemTitle}」的具体情况'
]

const fetchUserInfo = async (userId) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`/api/auth/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const user = response.data
    if (user && user._id) {
      return {
        _id: user._id,
        userName: user.name,
        userAvatar: user.avatar,
        lastMessage: { content: '点击开始聊天...', createdAt: new Date() },
        unreadCount: 0,
        isNew: true
      }
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
    return null
  }
}

const fetchConversations = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/messages/conversations', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.success) {
      conversations.value = response.data.data
    }
  } catch (err) {
    console.error('获取会话列表失败:', err)
  }
}

const autoSelectFromRoute = async () => {
  const { userId, itemId, itemTitle } = route.query
  if (!userId) return

  let conversation = conversations.value.find(c => c._id === userId)
  
  if (!conversation) {
    const newConversation = await fetchUserInfo(userId)
    if (newConversation) {
      conversation = newConversation
    }
  }

  if (conversation) {
    selectedConversation.value = conversation
    await fetchMessages(conversation._id)
    await fetchConversations()
    
    if (itemId && itemTitle) {
      itemInfo.value = { itemId, itemTitle }
      showQuickMessages.value = true
    }
  }
}

const selectConversation = async (conversation) => {
  selectedConversation.value = conversation
  
  // 检测是否是系统消息会话（必须在任何异步操作之前设置）
  isSystemConversation.value = conversation.isSystem || false
  
  await fetchMessages(conversation._id)
  await fetchConversations()
  showQuickMessages.value = false
  itemInfo.value = null
  
  startMessagePolling()
}

const useQuickMessage = async (template) => {
  if (!itemInfo.value || !selectedConversation.value) return
  
  const message = template.replace('{itemTitle}', itemInfo.value.itemTitle)
  newMessage.value = message
  showQuickMessages.value = false
}

const deleteConversation = async (userId) => {
  if (!confirm('确定要删除与该用户的聊天记录吗？')) return
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.delete(
      `/api/messages/conversation/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.data.success) {
      alert('聊天记录已删除')
      if (selectedConversation.value?._id === userId) {
        selectedConversation.value = null
        currentMessages.value = []
      }
      await fetchConversations()
    }
  } catch (err) {
    console.error('删除聊天记录失败:', err)
    alert(err.response?.data?.message || '删除聊天记录失败')
  }
}

const fetchMessages = async (userId) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`/api/messages/conversation/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.success) {
      currentMessages.value = response.data.data
      await nextTick(() => {
        messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  } catch (err) {
    console.error('获取消息失败:', err)
  }
}

const sendMessage = async () => {
  console.log('sendMessage called - newMessage:', newMessage.value, 'previewImageUrls:', previewImageUrls.value)
  
  if ((!newMessage.value.trim() && previewImageUrls.value.length === 0) || !selectedConversation.value) {
    console.log('returning early - no message or no conversation')
    return
  }

  try {
    const token = localStorage.getItem('token')
    console.log('token exists:', !!token)
    console.log('selectedConversation:', selectedConversation.value?._id)
    
    // 先发送文字消息（如果有）
    if (newMessage.value.trim()) {
      console.log('sending text message:', newMessage.value.trim())
      const textResponse = await axios.post(
        '/api/messages/send/' + selectedConversation.value._id,
        { content: newMessage.value.trim(), image: '' },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      if (textResponse.data.success) {
        currentMessages.value.push(textResponse.data.data)
      }
    }
    
    // 发送图片消息（每张图片一条消息）
    console.log('sending', previewImageUrls.value.length, 'image messages')
    for (const imageUrl of previewImageUrls.value) {
      console.log('sending image:', imageUrl)
      try {
        const response = await axios.post(
          '/api/messages/send/' + selectedConversation.value._id,
          { content: '', image: imageUrl },
          { headers: { Authorization: 'Bearer ' + token } }
        )
        console.log('image send response:', response.data)
        if (response.data.success) {
          currentMessages.value.push(response.data.data)
        }
      } catch (imgErr) {
        console.error('发送图片失败:', imgErr.response?.data || imgErr.message)
      }
    }
    
    newMessage.value = ''
    previewImageUrls.value = []
    showQuickMessages.value = false
    await nextTick(() => {
      messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
    })
    fetchConversations()
  } catch (err) {
    console.error('发送消息失败:', err)
    alert(err.response?.data?.message || '发送消息失败')
  }
}

const handleImageUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  console.log('选择了', files.length, '个文件')

  // 检查是否超过最大数量
  if (previewImageUrls.value.length + files.length > 9) {
    alert('最多只能选择9张图片')
    return
  }

  // 检查文件
  for (const file of files) {
    // 检查文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert(`图片 ${file.name} 大小超过5MB`)
      return
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert(`文件 ${file.name} 不是图片格式`)
      return
    }
  }

  try {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    for (const file of files) {
      formData.append('images', file)
    }

    console.log('开始上传图片...')
    const response = await axios.post('/api/messages/upload-image', formData, {
      headers: { 
        Authorization: 'Bearer ' + token,
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('上传图片响应:', response.data)
    if (response.data.success) {
      previewImageUrls.value = [...previewImageUrls.value, ...response.data.data.imageUrls]
      console.log('预览图片URLs:', previewImageUrls.value)
    }
  } catch (err) {
    console.error('上传图片失败:', err.response?.data || err.message)
    alert(err.response?.data?.message || '上传图片失败')
  }

  // 清空input，允许重复选择同一文件
  event.target.value = ''
}

const cancelImagePreview = () => {
  previewImageUrls.value = []
}

const removePreviewImage = (index) => {
  previewImageUrls.value.splice(index, 1)
}

const previewImage = (imageUrl) => {
  viewerImageUrl.value = imageUrl
  showImageViewer.value = true
}

const closeImageViewer = () => {
  showImageViewer.value = false
  viewerImageUrl.value = ''
}

const isSentMessage = (message) => {
  // 系统消息显示为接收方消息（左侧）
  if (message.isSystem) return false
  
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userId = user._id || user.id
  
  if (!userId) return false
  
  // 处理 senderId 为 null 的情况（系统消息）
  if (!message.senderId) return false
  
  const senderId = message.senderId._id || message.senderId
  
  return String(senderId) === String(userId)
}

const canRevoke = (message) => {
  if (!message.createdAt) return false
  const now = new Date()
  const diff = now - new Date(message.createdAt)
  const fiveMinutes = 5 * 60 * 1000
  return diff <= fiveMinutes
}

const revokeMessage = async (messageId) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put(
      `/api/messages/revoke/${messageId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (response.data.success) {
      const messageIndex = currentMessages.value.findIndex(m => m._id === messageId)
      if (messageIndex !== -1) {
        currentMessages.value[messageIndex].isRevoked = true
        currentMessages.value[messageIndex].content = '[消息已撤回]'
      }
      await fetchConversations()
    }
  } catch (err) {
    console.error('撤回消息失败:', err)
    alert(err.response?.data?.message || '撤回消息失败')
  }
}

const startMessagePolling = () => {
  stopMessagePolling()
  messagePollingInterval = setInterval(async () => {
    if (!selectedConversation.value) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`/api/messages/conversation/${selectedConversation.value._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        const serverMessages = response.data.data
        
        serverMessages.forEach(serverMsg => {
          const localMsg = currentMessages.value.find(m => m._id === serverMsg._id)
          if (localMsg && serverMsg.isRevoked && !localMsg.isRevoked) {
            localMsg.isRevoked = true
            localMsg.content = '[消息已撤回]'
          }
        })
      }
    } catch (err) {
      console.error('轮询消息失败:', err)
    }
  }, 3000)
}

const stopMessagePolling = () => {
  if (messagePollingInterval) {
    clearInterval(messagePollingInterval)
    messagePollingInterval = null
  }
}

const openTradeModal = async () => {
  try {
    // 获取对方用户（售卖方）的商品列表
    const targetUserId = selectedConversation.value._id
    const response = await axios.get(`/api/items/user/${targetUserId}`)
    if (response.data) {
      myItems.value = response.data.filter(item => item.status === 'available')
    }
  } catch (err) {
    console.error('获取对方商品列表失败:', err)
    myItems.value = []
  }
  selectedTradeItem.value = null
  showTradeModal.value = true
}

const closeTradeModal = () => {
  showTradeModal.value = false
  selectedTradeItem.value = null
}

const selectTradeItem = (item) => {
  selectedTradeItem.value = item
}

const getItemStatus = (status) => {
  const statusMap = {
    available: '在售',
    sold: '已售出',
    removed: '已下架'
  }
  return statusMap[status] || status
}

const getTradeStatusText = (status) => {
  const statusMap = {
    pending: '待确认',
    accepted: '已同意',
    rejected: '已拒绝'
  }
  return statusMap[status] || status
}

const acceptTradeRequest = async (messageId) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put(
      `/api/messages/trade-request/${messageId}/accept`,
      {},
      { headers: { Authorization: 'Bearer ' + token } }
    )
    
    if (response.data.success) {
      const messageIndex = currentMessages.value.findIndex(m => m._id === messageId)
      if (messageIndex !== -1) {
        currentMessages.value[messageIndex].tradeStatus = 'accepted'
      }
      await fetchConversations()
    }
  } catch (err) {
    console.error('同意交易请求失败:', err)
    alert(err.response?.data?.message || '同意交易请求失败')
  }
}

const rejectTradeRequest = async (messageId) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put(
      `/api/messages/trade-request/${messageId}/reject`,
      {},
      { headers: { Authorization: 'Bearer ' + token } }
    )
    
    if (response.data.success) {
      const messageIndex = currentMessages.value.findIndex(m => m._id === messageId)
      if (messageIndex !== -1) {
        currentMessages.value[messageIndex].tradeStatus = 'rejected'
      }
      await fetchConversations()
    }
  } catch (err) {
    console.error('拒绝交易请求失败:', err)
    alert(err.response?.data?.message || '拒绝交易请求失败')
  }
}

const submitTradeRequest = async () => {
  if (!selectedTradeItem.value) return
  
  // 记录发送前的消息数量，用于判断是否发送成功
  const beforeCount = currentMessages.value.length
  
  try {
    const token = localStorage.getItem('token')
    console.log('开始发送交易请求，目标用户:', selectedConversation.value._id)
    console.log('商品信息:', selectedTradeItem.value.title, selectedTradeItem.value.images[0])
    
    const response = await axios.post(
      '/api/messages/send/' + selectedConversation.value._id,
      {
        content: `您好，我想购买您发布的【${selectedTradeItem.value.title}】，价格 ¥${selectedTradeItem.value.price}`,
        image: selectedTradeItem.value.images[0] || '',
        isTradeRequest: true,
        tradeItemId: selectedTradeItem.value._id
      },
      { headers: { Authorization: 'Bearer ' + token } }
    )
    
    console.log('交易请求响应:', response.data)
    
    if (response.data && response.data.success) {
      currentMessages.value.push(response.data.data)
      closeTradeModal()
      scrollToBottom()
      console.log('交易请求发送成功')
    } else if (response.data && !response.data.success) {
      alert(response.data.message || '发送交易请求失败')
    } else {
      console.error('响应数据格式异常:', response)
      // 如果消息已经发送成功（数量增加了），就不显示错误
      if (currentMessages.value.length <= beforeCount) {
        alert('响应数据格式异常')
      }
    }
  } catch (err) {
    console.error('发送交易请求失败 - catch:', err)
    
    // 检查消息是否已经发送成功（通过消息数量是否增加来判断）
    const messageSentSuccessfully = currentMessages.value.length > beforeCount
    
    if (messageSentSuccessfully) {
      // 消息已经发送成功，可能是响应延迟导致的catch触发
      console.log('消息已成功发送，但catch被触发，可能是网络延迟')
      closeTradeModal()
      scrollToBottom()
      return
    }
    
    if (err.response) {
      alert(err.response.data?.message || '发送交易请求失败')
    } else if (err.request) {
      alert('请求已发送，但服务器未响应')
    } else {
      alert('发送交易请求失败: ' + err.message)
    }
  }
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
}

watch(selectedConversation, () => {
  newMessage.value = ''
})

onMounted(async () => {
  await fetchConversations()
  await autoSelectFromRoute()
})

onUnmounted(() => {
  stopMessagePolling()
})
</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.messages-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 20px;
  height: calc(100vh - 40px);
}

.conversation-list {
  width: 350px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.conversation-list h3 {
  padding: 16px;
  margin: 0;
  border-bottom: 1px solid #eee;
  color: #333;
}

.conversation-items {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 16px 12px 36px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.conversation-item:hover {
  background-color: #f8f8f8;
}

.conversation-item.active {
  background-color: #e8f5e9;
}

.conversation-item.system {
  background-color: #fff3e0;
}

.conversation-item.system:hover {
  background-color: #ffe0b2;
}

.conversation-item.system.active {
  background-color: #ffcc80;
}

.conversation-item .avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.conversation-info {
  flex: 1;
  overflow: hidden;
}

.conversation-info .user-name {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.conversation-info .last-message {
  display: block;
  font-size: 14px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-meta {
  text-align: right;
}

.delete-conversation-btn {
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 40px;
  border-radius: 3px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  margin-right: 4px;
}

.conversation-item:hover .delete-conversation-btn {
  opacity: 1;
}

.delete-conversation-btn:hover {
  background-color: #f44336;
  border-color: #f44336;
}

.delete-icon {
  font-size: 12px;
  color: #999;
  line-height: 1;
}

.delete-conversation-btn:hover .delete-icon {
  color: white;
}

.conversation-meta .time {
  display: block;
  font-size: 12px;
  color: #aaa;
  margin-bottom: 4px;
}

.unread-count {
  background-color: #f44336;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #999;
}

.chat-area {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.chat-header .avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.chat-header .user-name {
  font-weight: 500;
  font-size: 16px;
  color: #333;
}

.chat-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.messages-list {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.message-item.sent {
  align-self: flex-end;
}

.message-content {
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
}

.text-content {
  margin: 0;
}

.message-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
  display: block;
}

.message-item:not(.sent) .message-content {
  background-color: #f0f0f0;
  color: #333;
  border-radius: 18px 18px 18px 4px;
}

.message-item.sent .message-content {
  background-color: #4CAF50;
  color: white;
  border-radius: 18px 18px 4px 18px;
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.message-item.sent .message-footer {
  justify-content: flex-end;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin: 4px 8px;
}

.revoke-btn {
  font-size: 12px;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.revoke-btn:hover {
  color: #f44336;
  background-color: rgba(244, 67, 54, 0.1);
}

.message-item.revoked .message-content {
  background-color: #f5f5f5;
  color: #999;
  font-style: italic;
}

.revoked-text {
  font-size: 14px;
}

.quick-messages {
  padding: 12px 16px;
  background: linear-gradient(135deg, #e8f5e9 0%, #f3e5f5 100%);
  border-top: 1px solid #eee;
}

.quick-messages-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.quick-messages-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-message-btn {
  padding: 6px 12px;
  background-color: white;
  border: 1px solid #4CAF50;
  border-radius: 16px;
  font-size: 13px;
  color: #4CAF50;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-message-btn:hover {
  background-color: #4CAF50;
  color: white;
}

.chat-input-area {
  display: flex;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid #eee;
  align-items: center;
}

.image-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.image-btn:hover {
  background-color: #e0e0e0;
  border-color: #ccc;
}

.image-preview {
  padding: 12px 16px;
  border-top: 1px solid #eee;
  background-color: #f9f9f9;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-header span {
  font-size: 14px;
  color: #666;
}

.cancel-preview-btn {
  padding: 4px 12px;
  background-color: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.cancel-preview-btn:hover {
  background-color: #e0e0e0;
}

.preview-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

.remove-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  border-radius: 50%;
  background-color: #f44336;
  color: white;
  border: 2px solid white;
  cursor: pointer;
  font-size: 14px;
  line-height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  flex-shrink: 0;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.remove-image-btn:hover {
  background-color: #d32f2f;
}

.image-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.image-viewer img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  cursor: default;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
}

.message-input:focus {
  border-color: #4CAF50;
}

.send-btn {
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.send-btn:hover {
  background-color: #45a049;
}

.scroll-bottom {
  height: 1px;
}

.trade-btn {
  padding: 12px 20px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.trade-btn:hover {
  background-color: #1976D2;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: #f5f5f5;
  color: #666;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background-color: #eee;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.trade-info {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.item-card {
  border: 2px solid #eee;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.item-card:hover {
  border-color: #2196F3;
}

.item-card.selected {
  border-color: #2196F3;
  background-color: #f5f9ff;
}

.item-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
}

.item-info {
  text-align: center;
}

.item-title {
  margin: 0 0 4px 0;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #f44336;
  font-weight: bold;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.status-badge.available {
  background-color: #E8F5E9;
  color: #4CAF50;
}

.status-badge.sold {
  background-color: #FFF3E0;
  color: #FF9800;
}

.status-badge.removed {
  background-color: #FCE4EC;
  color: #E91E63;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn:hover {
  background-color: #f5f5f5;
}

.submit-btn {
  padding: 10px 24px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.submit-btn:hover:not(.disabled) {
  background-color: #1976D2;
}

.submit-btn.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* 交易请求反馈卡片样式 */
.trade-feedback-card {
  border-radius: 12px;
  padding: 16px;
  min-width: 220px;
  max-width: 280px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.trade-feedback-card.accepted {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.trade-feedback-card.rejected {
  background: linear-gradient(135deg, #f44336 0%, #da190b 100%);
}

.trade-feedback-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.trade-feedback-content {
  flex: 1;
}

.trade-feedback-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: bold;
  color: white;
}

.trade-feedback-desc {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

/* 交易请求卡片样式 */
.trade-request-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 16px;
  color: white;
  min-width: 280px;
  max-width: 350px;
}

.trade-request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.trade-tag {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.status-tag.pending {
  background-color: #FFC107;
  color: #333;
}

.status-tag.accepted {
  background-color: #4CAF50;
  color: white;
}

.status-tag.rejected {
  background-color: #f44336;
  color: white;
}

.trade-request-content {
  display: flex;
  gap: 12px;
}

.trade-item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.trade-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.trade-message {
  margin: 0 0 12px 0;
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.95;
}

.trade-actions {
  display: flex;
  gap: 8px;
}

.trade-action-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.accept-btn {
  background-color: #4CAF50;
  color: white;
}

.accept-btn:hover {
  background-color: #45a049;
}

.reject-btn {
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.reject-btn:hover {
  background-color: rgba(255, 255, 255, 0.4);
}
</style>