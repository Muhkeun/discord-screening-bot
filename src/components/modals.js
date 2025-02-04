const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function createScreeningModal() {
  const modal = new ModalBuilder()
    .setCustomId('screeningModal')
    .setTitle('상영 정보 입력');

  const titleInput = new TextInputBuilder()
    .setCustomId('titleInput')
    .setLabel('영화/애니 제목')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('예: Your Name');

  const episodeInput = new TextInputBuilder()
    .setCustomId('episodeInput')
    .setLabel('에피소드 번호 (옵션)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('없으면 비워두세요')
    .setRequired(false);

  const screeningTimeInput = new TextInputBuilder()
    .setCustomId('screeningTimeInput')
    .setLabel('상영 시간')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('예: 2025-02-10 20:00');

  return modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(episodeInput),
    new ActionRowBuilder().addComponents(screeningTimeInput)
  );
}

function createReviewModal(messageId, existingReview = null) {
  const modal = new ModalBuilder()
    .setCustomId(`reviewModal_${messageId}`)
    .setTitle('한줄평 작성');

  const ratingInput = new TextInputBuilder()
    .setCustomId('rating')
    .setLabel('별점 (1-10)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('1부터 10까지의 숫자를 입력해주세요')
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(2);

  const commentInput = new TextInputBuilder()
    .setCustomId('comment')
    .setLabel('한줄평')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('영화에 대한 한줄평을 작성해주세요')
    .setRequired(true)
    .setMaxLength(100);

  if (existingReview) {
    ratingInput.setValue(existingReview.rating.toString());
    commentInput.setValue(existingReview.comment);
  }

  return modal.addComponents(
    new ActionRowBuilder().addComponents(ratingInput),
    new ActionRowBuilder().addComponents(commentInput)
  );
}

module.exports = {
  createScreeningModal,
  createReviewModal
}; 