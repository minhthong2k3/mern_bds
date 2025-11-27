import { useEffect, useState } from 'react';

export default function Contact({ listing }) {
  const [landlord, setLandlord] = useState(null);
  const [message, setMessage] = useState('');

  const onChange = (e) => setMessage(e.target.value);

  useEffect(() => {
    const fetchLandlord = async () => {
      try {
        // 👇 ĐỔI SANG public endpoint
        const res = await fetch(`/api/user/public/${listing.userRef}`);
        const data = await res.json();
        setLandlord(data);
      } catch (error) {
        console.log(error);
      }
    };

    if (listing.userRef) fetchLandlord();
  }, [listing.userRef]);

  if (!landlord) return null;

  const listingTitle = listing.name || listing.title || 'Listing';
  const email = (landlord.email || '').trim();

  if (!email) {
    console.warn('Landlord email is missing', landlord);
    return null;
  }

  const isGmail = email.toLowerCase().endsWith('@gmail.com');

  const subjectText = `Liên hệ về: ${listingTitle}`;
  const bodyLines = [
    `Tiêu đề: ${listingTitle}`,
    listing.address ? `Địa chỉ: ${listing.address}` : null,
    listing.price_text ? `Giá: ${listing.price_text}` : null,
    '',
    '----- Lời nhắn từ người quan tâm -----',
    message || '(Chưa nhập lời nhắn)',
  ].filter(Boolean);

  const subject = encodeURIComponent(subjectText);
  const body = encodeURIComponent(bodyLines.join('\n'));

  const href = isGmail
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`
    : `mailto:${email}?subject=${subject}&body=${body}`;

  return (
    <div className="flex flex-col gap-2">
      <p>
        Contact <span className="font-semibold">{landlord.username}</span> for{' '}
        <span className="font-semibold">{listingTitle}</span>
      </p>

      <textarea
        name="message"
        id="message"
        rows="2"
        value={message}
        onChange={onChange}
        placeholder="Nhập lời nhắn của bạn..."
        className="w-full border p-3 rounded-lg"
      />

      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="bg-slate-700 text-white text-center p-3 uppercase rounded-lg hover:opacity-95"
      >
        Send message
      </a>
    </div>
  );
}
