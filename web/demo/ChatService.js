import axios from 'axios';

class ChatService {
  constructor() {
    this.onDataCallback = null;
    this.onCompleteCallback = null;
    this.messageBuffer = '';
    this.currentAnswer = ''; // 用于累积当前回答的内容
  }

  async streamChat(payload) {
    try {
      // 重置当前回答
      this.currentAnswer = '';

      return await axios({
        method: 'post',
        url: 'http://127.0.0.1:9380/v1/conversation/completion',
        data: payload,
        responseType: 'text',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        onDownloadProgress: (progressEvent) => {
          const xhr = progressEvent.target;
          const { responseText } = xhr;

          if (responseText) {
            // 将新数据添加到buffer中
            const newData = responseText.slice(this.messageBuffer.length);
            this.messageBuffer = responseText;

            // 处理新接收的数据
            const lines = newData
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line && line.startsWith('data:'));

            lines.forEach((line) => {
              try {
                const jsonData = JSON.parse(line.slice(5));

                // 检查是否是结束信号
                if (jsonData.data === true) {
                  if (this.onCompleteCallback) {
                    this.onCompleteCallback();
                  }
                  return;
                }

                // 处理正常的消息数据
                if (jsonData.data && jsonData.data.answer !== undefined) {
                  // 更新当前累积的回答
                  this.currentAnswer = jsonData.data.answer;

                  if (this.onDataCallback) {
                    this.onDataCallback({
                      answer: this.currentAnswer,
                      reference: jsonData.data.reference || [],
                    });
                  }
                }
              } catch (e) {
                console.error('Parse response data error:', e);
              }
            });
          }
        },
      });
    } catch (error) {
      console.error('Stream chat error:', error);
      throw error;
    }
  }

  setDataCallback(callback) {
    this.onDataCallback = callback;
  }

  setCompleteCallback(callback) {
    this.onCompleteCallback = callback;
  }

  cleanup() {
    this.messageBuffer = '';
    this.currentAnswer = '';
    this.onDataCallback = null;
    this.onCompleteCallback = null;
  }
}

export default new ChatService();
