import './Blog.css';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { ReleaseStream } from '../../../common/ReleaseService';
import { useCancellableEffect } from '../../hooks';

export interface BlogProps {
  releaseStream: ReleaseStream;
}

export default function Blog(props: BlogProps) {
  const { releaseStream } = props;

  const [changelog, setChangelog] = useState<string>('# Loading...');

  useCancellableEffect(
    (isCancelled) => {
      window.releaseStreamApi
        .getLastReleases(releaseStream, 25)
        .then((rel) => {
          if (isCancelled()) return null;
          return setChangelog(
            rel
              .filter((r) => r.changelog)
              .map((r) => {
                const date = r.publishedAt
                  ? `(${new Date(r.publishedAt).toLocaleDateString()})`
                  : '';
                return `# Release ${r.version} ${date}\n\n${r.changelog}\n\n`;
              })
              .join('\n\n'),
          );
        })
        .catch((error) => {
          console.error(
            'Failed to get last releases for changelog feed',
            error,
          );
          setChangelog('Failed to load changelog');
        });
    },
    [releaseStream.id],
  );

  return (
    <div className="Blog">
      <Markdown className="BlogContent">{changelog}</Markdown>
    </div>
  );
}
