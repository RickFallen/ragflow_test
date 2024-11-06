// ChatComponent.vue
<template>
  <div class="chat-container">
    <div class="messages-area" ref="messagesContainer">
      <div v-for="message in messages" :key="message.id" :class="['message', message.role]">
        {{ message.content }}
      </div>
      <div v-if="currentAnswer" class="message assistant streaming">
        {{ currentAnswer }}
      </div>
    </div>

    <div class="input-area">
      <textarea
        v-model="inputMessage"
        class="message-input"
        placeholder="请输入您的问题..."
        @keydown.enter.exact.prevent="sendMessage"
      ></textarea>
      <button
        class="send-button"
        @click="sendMessage"
        :disabled="isLoading || !inputMessage.trim()"
      >
        {{ isLoading ? '发送中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script>
import ChatService from '@/api/ChatService'

export default {
  name: 'ChatComponent',
  data() {
    return {
      messages: [],
      currentAnswer: '',
      conversationId: '96a3c9d0af82422d9fce95d77c65125f',
      inputMessage: '',
      isLoading: false,
      currentMessageId: null
    }
  },
  created() {
    // 设置回调函数
    ChatService.setDataCallback(this.handleStreamData)
    ChatService.setCompleteCallback(this.handleComplete)
  },
  mounted() {
    this.scrollToBottom()
  },
  updated() {
    this.$nextTick(() => {
      this.scrollToBottom()
    })
  },
  methods: {
    async sendMessage() {
      if (!this.inputMessage.trim() || this.isLoading) return

      const userMessage = this.inputMessage.trim()
      // 保存原始消息内容，避免清空输入框影响发送的内容
      const messageToSend = userMessage
      this.inputMessage = ''
      this.isLoading = true
      this.currentAnswer = ''
      this.currentMessageId = null

      // 添加用户消息到消息列表
      const userMessageObj = {
        content: messageToSend, // 使用保存的原始消息
        id: `user_${Date.now()}`,
        role: 'user',
        doc_ids: []
      }

      this.messages.push(userMessageObj)

      try {
        const payload = {
          conversation_id: this.conversationId,
          messages: [{
            content: messageToSend, // 使用保存的原始消息
            id: userMessageObj.id,
            role: 'user',
            doc_ids: []
          }],
          stream: true
        }

        await ChatService.streamChat(payload)
      } catch (error) {
        console.error('Send message error:', error)
        this.currentAnswer = '发送失败，请重试'
        this.isLoading = false
      }
    },
    // chat.vue
    handleStreamData(data) {
      if (data.answer !== undefined) {
        this.currentAnswer = data.answer;

        // 始终滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    handleComplete() {
      if (this.currentAnswer) {
        // 将完整的回答添加到消息列表
        this.messages.push({
          content: this.currentAnswer,
          role: 'assistant',
          id: this.currentMessageId || `assistant_${Date.now()}`
        })

        // 清理状态
        this.currentAnswer = ''
        this.currentMessageId = null
        this.isLoading = false
      }
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: #f5f5f5;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  max-width: 80%;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message.user {
  background-color: #e3f2fd;
  margin-left: auto;
  color: #1976d2;
}

.message.assistant {
  background-color: #f5f5f5;
  margin-right: auto;
  color: #333;
}

.message.streaming {
  opacity: 0.8;
}

.input-area {
  padding: 20px;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-input {
  flex: 1;
  min-height: 60px;
  max-height: 120px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
}

.message-input:focus {
  border-color: #1976d2;
}

.send-button {
  padding: 12px 24px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background-color: #1565c0;
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
