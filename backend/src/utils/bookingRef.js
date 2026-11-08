/**
 * Generates unique booking reference e.g., SCRIM-BGMI-482910
 */
export function generateBookingReference(gameSlug = 'BGMI') {
  const cleanSlug = gameSlug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'SCR';
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SCRIM-${cleanSlug}-${randomNum}`;
}

/**
 * Builds the official WhatsApp click-to-chat prefilled text
 */
export function generateWhatsAppMessage({
  playerName,
  playerId,
  mobileNumber,
  email,
  teamName,
  gameTitle,
  tournamentTitle,
  matchSchedule,
  slotNumber,
  entryFee,
  bookingReference
}) {
  return `⚡ *SCRIMS OFFICIAL TOURNAMENT BOOKING* ⚡
-----------------------------------------
*Booking Ref:* ${bookingReference}
*Tournament:* ${tournamentTitle}
*Game:* ${gameTitle}
*Match Schedule:* ${matchSchedule}
*Reserved Slot:* Slot #${slotNumber}
*Entry Fee:* ₹${entryFee}

*Player Details:*
• Name: ${playerName}
• In-Game UID: ${playerId || 'N/A'}
• Team: ${teamName}
• Mobile: ${mobileNumber}
• Email: ${email}

-----------------------------------------
I have completed the payment of ₹${entryFee} and request manual verification of my slot reservation. Thank you!`;
}
