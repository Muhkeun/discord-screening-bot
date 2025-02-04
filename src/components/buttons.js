const { ButtonBuilder, ButtonStyle } = require('discord.js');
const { EMOJIS } = require('../utils/constants');

function createAttendanceButtons(messageId) {
  return [
    new ButtonBuilder()
      .setCustomId(`attend_${messageId}`)
      .setLabel('참석')
      .setEmoji(EMOJIS.ATTEND)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`maybe_${messageId}`)
      .setLabel('미정')
      .setEmoji(EMOJIS.MAYBE)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`notAttend_${messageId}`)
      .setLabel('불참')
      .setEmoji(EMOJIS.NOT_ATTEND)
      .setStyle(ButtonStyle.Danger)
  ];
}

function createUtilityButtons(messageId, isTheaterActive = false) {
  return [
    new ButtonBuilder()
      .setCustomId(`showAttendees_${messageId}`)
      .setLabel('참가자 목록')
      .setEmoji(EMOJIS.ATTENDEES)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`review_${messageId}`)
      .setLabel('한줄평 작성')
      .setEmoji(EMOJIS.REVIEW)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`showReviews_${messageId}`)
      .setLabel('한줄평 목록')
      .setEmoji(EMOJIS.REVIEWS)
      .setStyle(ButtonStyle.Primary)
  ];
}

function createTheaterButtons(messageId, isTheaterActive = false) {
  return [
    new ButtonBuilder()
      .setCustomId(`createTheater_${messageId}`)
      .setLabel(isTheaterActive ? '상영중' : '상영관 생성')
      .setEmoji('🎬')
      .setStyle(isTheaterActive ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setDisabled(isTheaterActive),
    new ButtonBuilder()
      .setCustomId(`endTheater_${messageId}`)
      .setLabel('상영 종료')
      .setEmoji('🔚')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!isTheaterActive)
  ];
}

module.exports = {
  createAttendanceButtons,
  createUtilityButtons,
  createTheaterButtons
}; 