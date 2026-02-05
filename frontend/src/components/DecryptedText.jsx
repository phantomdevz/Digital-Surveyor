import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const CYCLES_PER_LETTER = 2;
const SHUFFLE_TIME = 50;
const CHARS = '!@#$%^&*():{};|,.<>/?';

export default function DecryptedText({
  text,
  className = '',
  animateOn = 'view',
  revealDirection = 'start',
  sequential = false,
  useOriginalCharsOnly = false
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    if (animateOn === 'view') {
      scramble();
    }
  }, [text]);

  const scramble = () => {
    setIsDecrypting(true);
    let pos = 0;

    const interval = setInterval(() => {
      const scrambled = text
        .split('')
        .map((char, index) => {
          if (index < pos) {
            return text[index];
          }

          const randomChar = useOriginalCharsOnly
            ? text[Math.floor(Math.random() * text.length)]
            : CHARS[Math.floor(Math.random() * CHARS.length)];

          return char === ' ' ? ' ' : randomChar;
        })
        .join('');

      setDisplayText(scrambled);
      pos += 1 / CYCLES_PER_LETTER;

      if (pos >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
        setIsDecrypting(false);
      }
    }, SHUFFLE_TIME);

    return () => clearInterval(interval);
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayText}
    </motion.span>
  );
}
