const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/constants');
const { getRatingStars } = require('../utils/helpers');

function createScreeningEmbed(details, screeningData) {
  return new EmbedBuilder()
    .setTitle(`🎬 ${details.title || details.name}`)
    .setURL(`https://www.themoviedb.org/${details.media_type}/${details.id}`)
    .setDescription(
      `### 📅 상영 정보\n` +
      `**상영 일시:** ${screeningData.screeningTime}\n` +
      (screeningData.episode ? `**에피소드:** ${screeningData.episode}\n` : '') +
      `**상영 담당:** 미정\n\n` +
      `### 📊 참가 현황\n` +
      `참석: 0명 | 미정: 0명 | 불참: 0명\n\n` +
      `### ℹ️ 작품 정보\n` +
      `⏱️ **러닝타임:** ${details.runtime ? `${details.runtime}분` : '정보 없음'}\n` +
      `⭐ **TMDB 평점:** ${details.vote_average}\n` +
      `🗓️ **개봉일:** ${details.release_date || details.first_air_date || '정보 없음'}`
    )
    .setColor(COLORS.DEFAULT);
}

function createReviewsEmbed(reviews) {
  const totalRating = Array.from(reviews.values()).reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.size;

  return new EmbedBuilder()
    .setTitle('참여자 한줄평 목록')
    .setDescription(`참여자 평균 별점: ${getRatingStars(averageRating)} (${averageRating.toFixed(1)}/10)`)
    .addFields(
      Array.from(reviews.entries()).map(([userId, review]) => ({
        name: `${getRatingStars(review.rating)} (${review.rating}/10)`,
        value: `<@${userId}>: ${review.comment}`
      }))
    )
    .setColor(COLORS.DEFAULT);
}

module.exports = {
  createScreeningEmbed,
  createReviewsEmbed
}; 