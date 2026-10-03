import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, AlertCircle, CheckCircle, Trophy, XCircle, Filter, ArrowRight } from 'lucide-react';

export default function MemberBookings() {
  const { user, token } = useAuth();
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [courts, setCourts] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState(null);
  const [scheduleData, setScheduleData] = useState({ bookings: [], socialSessions: [] });
  const [myBookings, setMyBookings] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  // Time slots in 30-minute start increments from 06:00 to 22:00
  const timeSlots = [];
  for (let hour = 6; hour <= 21; hour++) {
    const hh = hour < 10 ? `0${hour}` : `${hour}`;
    timeSlots.push(`${hh}:00`);
    timeSlots.push(`${hh}:30`);
  }

  // Load Courts
  useEffect(() => {
    async function fetchCourts() {
      try {
        const res = await fetch('/api/public/courts');
        if (res.ok) {
          const data = await res.json();
          setCourts(data);
          if (data.length > 0 && !selectedCourtId) {
            setSelectedCourtId(data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchCourts();
  }, []);

  // Load Schedule for selected date and court
  const loadSchedule = async () => {
    if (!selectedDate) return;
    try {
      const url = selectedCourtId
        ? `/api/bookings/schedule?date=${selectedDate}&court_id=${selectedCourtId}`
        : `/api/bookings/schedule?date=${selectedDate}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setScheduleData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load member's own bookings
  const loadMyBookings = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/bookings/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [selectedDate, selectedCourtId]);

  useEffect(() => {
    loadMyBookings();
  }, [token]);

  // Compute end time (1-hour duration from start time)
  const computeEndTime = (startTime) => {
    const [hh, mm] = startTime.split(':').map(Number);
    const endH = hh + 1;
    return `${endH < 10 ? '0' + endH : endH}:${mm < 10 ? '0' + mm : mm}`;
  };

  // Handle Booking submission
  const handleBookSlot = async (slot) => {
    setBookingMessage(null);
    setBookingError(null);
    setLoading(true);

    const endTime = computeEndTime(slot);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          court_id: selectedCourtId,
          date: selectedDate,
          start_time: slot,
          end_time: endTime,
          booking_type: 'member',
          payment_method: 'card'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to book slot');
      }

      setBookingMessage(`Slot confirmed! Booking code: ${data.booking.booking_code} ($${data.booking.price.toFixed(2)})`);
      loadSchedule();
      loadMyBookings();
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Cancellation
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you wish to cancel this court reservation?')) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'Member cancelled via portal' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');

      alert(data.message);
      loadSchedule();
      loadMyBookings();
    } catch (err) {
      alert(`Cancellation error: ${err.message}`);
    }
  };

  const selectedCourt = courts.find(c => c.id === Number(selectedCourtId));

  // Determine if a slot is booked or overlapping
  const isSlotBooked = (slot) => {
    const slotEnd = computeEndTime(slot);
    return scheduleData.bookings.some(b => {
      // Overlap condition: NOT (b.end_time <= slot OR b.start_time >= slotEnd)
      return !(b.end_time <= slot || b.start_time >= slotEnd);
    });
  };

  const isSlotSocial = (slot) => {
    const slotEnd = computeEndTime(slot);
    return scheduleData.socialSessions.some(s => {
      return !(s.end_time <= slot || s.start_time >= slotEnd);
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Court Booking Engine</h1>
        <p className="text-xs text-slate-400 mt-1">
          Reserve 1-hour sessions beginning every 30 minutes. Strict zero double-booking concurrency validation.
        </p>
      </div>

      {bookingMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{bookingMessage}</span>
          </div>
          <button onClick={() => setBookingMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {bookingError && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{bookingError}</span>
          </div>
          <button onClick={() => setBookingError(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Control Bar: Date & Court Selector */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Select Play Date</label>
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Select Court / Arena</label>
          <select
            value={selectedCourtId || ''}
            onChange={(e) => setSelectedCourtId(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
          >
            {courts.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.court_type} - {c.sport_name})
              </option>
            ))}
          </select>
        </div>

        {selectedCourt && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <div className="text-[10px] text-slate-400">Your Tier Rate:</div>
              <div className="text-base font-mono font-bold text-emerald-400">
                ${(selectedCourt.hourly_rate_member * (1 - (user?.member?.court_discount_pct || 0) / 100)).toFixed(2)}/hr
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {user?.member?.court_discount_pct || 0}% Off Applied
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Time Grid (30-min start increments) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm text-white">
              Slot Grid for {selectedDate} ({selectedCourt?.name || 'Selected Court'})
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" />
              <span className="text-slate-300">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-950/80 border border-red-800 inline-block" />
              <span className="text-slate-400">Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-950/80 border border-amber-800 inline-block" />
              <span className="text-slate-400">Social Session</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 pt-2">
          {timeSlots.map(slot => {
            const booked = isSlotBooked(slot);
            const social = isSlotSocial(slot);
            const slotEnd = computeEndTime(slot);

            if (booked) {
              return (
                <div
                  key={slot}
                  className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-center space-y-1 opacity-70 cursor-not-allowed"
                >
                  <div className="font-mono text-xs font-bold text-red-300">{slot} - {slotEnd}</div>
                  <span className="text-[10px] text-red-400 uppercase font-semibold">Booked</span>
                </div>
              );
            }

            if (social) {
              return (
                <div
                  key={slot}
                  className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 text-center space-y-1 opacity-80 cursor-not-allowed"
                >
                  <div className="font-mono text-xs font-bold text-amber-300">{slot} - {slotEnd}</div>
                  <span className="text-[10px] text-amber-400 uppercase font-semibold">Social Play</span>
                </div>
              );
            }

            return (
              <button
                key={slot}
                disabled={loading}
                onClick={() => handleBookSlot(slot)}
                className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-center space-y-1 transition-all group hover:scale-[1.02]"
              >
                <div className="font-mono text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                  {slot} - {slotEnd}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold group-hover:underline">
                  Reserve
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Member's Reservation History */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-base text-white">Your Court Reservations History</h3>

        {myBookings.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            You have made no court bookings yet. Select an available slot above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Ref Code</th>
                  <th className="p-3">Court</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {myBookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-emerald-400">{b.booking_code}</td>
                    <td className="p-3 font-semibold text-white">{b.court_name}</td>
                    <td className="p-3">{b.date}</td>
                    <td className="p-3 font-mono">{b.start_time} - {b.end_time}</td>
                    <td className="p-3 font-mono">${Number(b.price).toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'Confirmed' ? 'bg-emerald-950 text-emerald-300' :
                        b.status === 'Checked In' ? 'bg-blue-950 text-blue-300' :
                        b.status === 'Cancelled' ? 'bg-slate-800 text-slate-400' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {b.status === 'Confirmed' && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
