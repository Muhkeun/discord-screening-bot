const { Collection } = require('discord.js');

class ScreeningService {
  constructor() {
    this.attendees = new Collection();
    this.reviews = new Collection();
    this.pendingScreenings = new Collection();
  }

  addAttendee(messageId, userId, status) {
    let messageAttendees = this.attendees.get(messageId) || {
      attend: new Set(),
      maybe: new Set(),
      notAttend: new Set(),
      host: null
    };

    // 기존 상태에서 제거
    messageAttendees.attend.delete(userId);
    messageAttendees.maybe.delete(userId);
    messageAttendees.notAttend.delete(userId);

    // 새로운 상태 추가
    messageAttendees[status].add(userId);
    this.attendees.set(messageId, messageAttendees);

    return messageAttendees;
  }

  setHost(messageId, hostId) {
    let messageAttendees = this.attendees.get(messageId) || {
      attend: new Set(),
      maybe: new Set(),
      notAttend: new Set(),
      host: null
    };
    messageAttendees.host = hostId;
    this.attendees.set(messageId, messageAttendees);
    return messageAttendees;
  }

  addReview(messageId, userId, rating, comment) {
    let messageReviews = this.reviews.get(messageId) || new Map();
    messageReviews.set(userId, { rating, comment });
    this.reviews.set(messageId, messageReviews);
    return messageReviews;
  }

  getReviews(messageId) {
    return this.reviews.get(messageId) || new Map();
  }

  getAttendees(messageId) {
    return this.attendees.get(messageId) || {
      attend: new Set(),
      maybe: new Set(),
      notAttend: new Set(),
      host: null
    };
  }

  addPendingScreening(uniqueId, data) {
    this.pendingScreenings.set(uniqueId, data);
  }

  getPendingScreening(uniqueId) {
    return this.pendingScreenings.get(uniqueId);
  }

  removePendingScreening(uniqueId) {
    this.pendingScreenings.delete(uniqueId);
  }
}

module.exports = new ScreeningService(); 