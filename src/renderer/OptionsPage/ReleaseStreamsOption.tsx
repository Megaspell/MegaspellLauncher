import { useEffect, useState } from 'react';

import listIcon from 'assets/images/list_FILL0_wght400_GRAD0_opsz24.svg';
import addIcon from 'assets/images/add_FILL0_wght400_GRAD0_opsz24.svg';
import deleteIcon from 'assets/images/delete_FILL0_wght400_GRAD0_opsz24.svg';
import publicIcon from 'assets/images/public_FILL0_wght400_GRAD0_opsz24.svg';
import lockIcon from 'assets/images/lock_FILL0_wght400_GRAD0_opsz24.svg';

import './ReleaseStreamsOption.css';
import IconButton from '../Lib/IconButton';
import {
  DefaultReleaseStream,
  ReleaseStream,
  ReleaseStreamType,
} from '../../common/ReleaseService';
import TextButton from '../Lib/TextButton';

interface ListEntryProps {
  stream: ReleaseStream;
  onRemoveClick: () => void;
}

function ListEntry(props: ListEntryProps) {
  const { stream, onRemoveClick } = props;
  const { id, githubRepository, githubToken } = stream;

  const isDefault = id === DefaultReleaseStream.id;
  const isPrivate = !!githubToken;

  if (isDefault) {
    return (
      <li className="ReleaseStreamEntry DefaultReleaseStreamEntry">
        <a
          title={`Open URL: ${githubRepository}`}
          href={`https://github.com/${githubRepository}`}
          target="_blank"
          rel="noreferrer"
        >
          [Default] {githubRepository}
        </a>
      </li>
    );
  }
  return (
    <li className="ReleaseStreamEntry">
      <img
        title={isPrivate ? 'Protected stream' : 'Public stream'}
        alt=""
        width="24"
        src={isPrivate ? lockIcon : publicIcon}
        className="ReleaseStreamEntryIcon"
      />
      <a
        title={`Open URL: ${githubRepository}`}
        href={`https://github.com/${githubRepository}`}
        target="_blank"
        rel="noreferrer"
      >
        [{id}] {githubRepository}
      </a>
      <IconButton
        title="Remove stream"
        icon={deleteIcon}
        iconSize={24}
        onClick={onRemoveClick}
      />
    </li>
  );
}

interface AddReleaseStreamModalProps {
  onSubmit: (stream: ReleaseStream) => void;
}

function AddReleaseStreamModal(props: AddReleaseStreamModalProps) {
  const { onSubmit } = props;

  const [open, setOpen] = useState(false);

  const dialog = (
    <div className="AddReleaseStreamModalContainer">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const target = e.target as any;
          const id = target.id.value as string;
          const githubRepository = target.githubRepository.value as string;
          const githubToken = target.githubToken.value as string;

          // Good enough
          if (
            !id ||
            id === '' ||
            !githubRepository ||
            githubRepository === ''
          ) {
            return;
          }

          onSubmit({
            id,
            type: ReleaseStreamType.GitHub,
            githubRepository,
            githubToken: githubToken === '' ? undefined : githubToken,
          });
          setOpen(false);
        }}
        className="AddReleaseStreamModal"
      >
        <h2>Add release stream</h2>
        <div className="AddReleaseStreamModalFields">
          <h4>Unique ID</h4>
          <input name="id" type="text" />
          <h4>GitHub Repository</h4>
          <input name="githubRepository" type="text" />
          <h4>GitHub Token (optional)</h4>
          <input name="githubToken" type="text" />
        </div>
        <div className="AddReleaseStreamModalButtons">
          <TextButton text="Add stream" type="submit" onClick={() => {}} />
          <TextButton text="Cancel" onClick={() => setOpen(false)} />
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <IconButton
        title="Add stream"
        icon={addIcon}
        iconSize="24"
        onClick={() => setOpen(true)}
      />
      {open ? dialog : undefined}
    </div>
  );
}

export default function ReleaseStreamOption() {
  const [releaseStreams, setReleaseStreams] = useState<ReleaseStream[]>([]);

  async function updateReleaseStreams() {
    const streams = await window.releaseStreamApi.getStreams();
    setReleaseStreams(streams);
  }

  useEffect(() => {
    updateReleaseStreams();
  }, []);

  async function removeStream(stream: ReleaseStream) {
    const removed = await window.releaseStreamApi.removeStream(stream);
    if (removed) {
      setReleaseStreams(releaseStreams.filter((it) => it.id !== stream.id));
    }
  }

  async function addStream(stream: ReleaseStream) {
    console.log('Trying to add release stream', stream);
    const added = await window.releaseStreamApi.addStream(stream);
    if (added) {
      setReleaseStreams(
        releaseStreams.filter((it) => it.id !== stream.id).concat(stream),
      );
    }
  }

  const releaseStreamList = releaseStreams.map((stream) => {
    return (
      <ListEntry
        stream={stream}
        onRemoveClick={() => {
          removeStream(stream);
        }}
        key={stream.id}
      />
    );
  });

  return (
    <div className="Option">
      <div className="ReleaseStreamHeader">
        <img alt="" width="24" height="24" src={listIcon} />
        <h2>Custom release streams</h2>
        {/* eslint-disable-next-line react/jsx-no-bind */}
        <AddReleaseStreamModal onSubmit={addStream} />
      </div>
      <ul className="ReleaseStreamList">{releaseStreamList}</ul>
    </div>
  );
}
