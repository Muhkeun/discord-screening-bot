const { MessageFlags } = require('discord.js');

function generateRandomId() {
  return Math.random().toString(36).substring(2, 10);
}

function getRatingStars(rating) {
  // 10점 만점을 5점 만점으로 변환 (2로 나누기)
  const normalizedRating = rating / 2;
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '⭐'.repeat(fullStars) + 
         (hasHalfStar ? '✨' : '') + 
         '☆'.repeat(emptyStars);
}

async function sendTemporaryMessage(interaction, content, duration = 5000) {
  try {
    const replyOptions = { 
      content,
      flags: MessageFlags.Ephemeral
    };

    let reply;
    if (interaction.replied || interaction.deferred) {
      reply = await interaction.followUp(replyOptions);
      setTimeout(async () => {
        try {
          await reply.delete().catch(() => {});
        } catch (error) {
          // 삭제 실패는 무시
        }
      }, duration);
    } else {
      reply = await interaction.reply(replyOptions);
      setTimeout(async () => {
        try {
          await interaction.deleteReply().catch(() => {});
        } catch (error) {
          // 삭제 실패는 무시
        }
      }, duration);
    }

    return reply;
  } catch (error) {
    console.error('임시 메시지 전송 중 오류:', error);
  }
}

async function editTemporaryMessage(interaction, options, duration = 5000) {
  try {
    // options가 문자열이면 content로 변환
    const replyOptions = typeof options === 'string' 
      ? { content: options } 
      : options;

    // ephemeral 플래그 추가
    replyOptions.flags = MessageFlags.Ephemeral;
    
    const reply = await interaction.editReply(replyOptions);
    
    setTimeout(async () => {
      try {
        await interaction.deleteReply().catch(() => {});
      } catch (error) {
        // 삭제 실패는 무시
      }
    }, duration);

    return reply;
  } catch (error) {
    console.error('임시 메시지 수정 중 오류:', error);
  }
}

module.exports = {
  generateRandomId,
  getRatingStars,
  sendTemporaryMessage,
  editTemporaryMessage
}; 