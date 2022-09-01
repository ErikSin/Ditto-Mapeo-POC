import { DocumentIDValue, MutableDocument } from '@dittolive/ditto'
import { useMutations, usePendingCursorOperation } from '@dittolive/react-ditto'
import React, { useEffect, useState } from 'react'
import './App.css'
//@ts-ignore
import RandomPoint from 'random-points-generator'

const COLLECTION = 'Observation'
const OFFLINE_LICENSE_TOKEN = 'o2d1c2VyX2lkeBg2MzBhOTNmOGNjNGVkOGEyZjdkZGIwYzlmZXhwaXJ5eBgyMDIyLTA5LTI3VDA2OjU5OjU5Ljk5OVppc2lnbmF0dXJleFhnd3BkWUxhdDVOemFjRmNvZlZuZEZVTmdReGl2NDBDS1pMbk9vanRLOHJnVDQyWkN2YTFHRG1LZGlPK0dpc1FvMUhKcE1yZHVjcFpDajRzUk1vSyt3UT09'

type Point = { _id?: DocumentIDValue; title: string; description:string, point:[number, number] }

function createRandomLatLong():[number, number]{
  const point =  RandomPoint.random(1)
  return point.features[0].geometry.coordinates
}

const App = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editId, setEditId] = useState('')
  const [isSyncing, setIsSycing] = useState(false)
  const { ditto, documents: points } = usePendingCursorOperation({
    collection: COLLECTION,
  })
  const { upsert, removeByID, updateByID } = useMutations({
    collection: COLLECTION,
  })

  useEffect(() => {
    if (!ditto) {
      return
    }

    ditto.setOfflineOnlyLicenseToken(OFFLINE_LICENSE_TOKEN)
    ditto.updateTransportConfig((t) => {
      t.setAllPeerToPeerEnabled(true)
      // Or selectively enable only some P2P tranports:
      // t.peerToPeer.awdl.isEnabled = true
      // t.peerToPeer.bluetoothLE.isEnabled = true
      // t.peerToPeer.lan.isEnabled = true
    })

  }, [ditto])

  const updateText = (e: React.ChangeEvent<HTMLInputElement>) =>
    setTitle(e.currentTarget.value)

  const updateDescription = (e: React.ChangeEvent<HTMLInputElement>) =>
    setDescription(e.currentTarget.value)

  const addPoint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    upsert({ value: { title, description, point:createRandomLatLong()} })
    setTitle('')
    setDescription('')
  }

  // const toggleIsCompleted =
  //   (taskId: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
  //     updateByID({
  //       _id: taskId,
  //       updateClosure: (mutableDoc:MutableDocument) => {
  //         if (mutableDoc) {
  //           mutableDoc.at('isCompleted').set(!mutableDoc.value.isCompleted)
  //         }
  //       },
  //     })

  const removeTask = (taskId: string) => () => removeByID({ _id: taskId })

  const setPointToBeEdited = (taskId: string) => () => {
    const pointToEdit = points.find(point => point.value._id === taskId)

    if(pointToEdit != undefined)
    {
      setEditTitle(pointToEdit.value.title)
      setEditDescription(pointToEdit.value.description)
      setEditId(pointToEdit.value._id)
    }
    
  }

  function editPoint(e: React.FormEvent<HTMLFormElement>)
  {
    e.preventDefault()
    updateByID({
      _id:editId,
      updateClosure:(doc:MutableDocument)=>{
        doc.at('title').set(editTitle);
        doc.at('description').set(editDescription)
      }
    }).then(()=>{setEditId('')})
  }

  function switchScreen(e: React.FormEvent<HTMLButtonElement>)
  {
    e.preventDefault();
    setIsSycing(prev => !prev)
  }

  return (
    <div className="App">
      <div className="count">
        {points.length} Observation{points.length !== 1 ? 's' : ''}
      </div>
      { editId !== "" ? 
        <React.Fragment>
          <form className="new count" onSubmit={editPoint}>
              <input
                value={editTitle}
                onChange={e=>setEditTitle(e.currentTarget.value)}
                required
              />
              <input
                value={editDescription}
                onChange={e=>setEditDescription(e.currentTarget.value)}
                required
              />
              <button type="submit">Edit</button>
          </form> 
          <button type="button" onClick={()=>setEditId("")}>
            Close
          </button>
        </React.Fragment>
        : 
        !isSyncing ? 
        <React.Fragment>
          <form className="new" onSubmit={addPoint}>
            <input
              placeholder="Title"
              value={title}
              onChange={updateText}
              required
            />
            <input
              placeholder="Description"
              value={description}
              onChange={updateDescription}
              required
            />
            <button type="submit">Add</button>
          </form>
          <ul>
            {points.map((point) => (
              <li key={point.value._id}>
                {/* <input
                  type="checkbox"
                  checked={point.value.isCompleted}
                  onChange={toggleIsCompleted(point.value._id)}
                /> */}
                <span className={point.value.isCompleted ? 'completed' : ''}>
                  {point.value.title + " "}
                  {point.value.description+ " "}
                  {point.value.point + " "} <code>(ID: {point.value._id})</code>
                </span>
                <button type="button" onClick={removeTask(point.value._id)}>
                  Remove
                </button>
                <button type="button" onClick={setPointToBeEdited(point.value._id)}>
                  Edit
                </button>
              </li>
            ))}
          </ul>

          <button type="button" onClick={switchScreen}>
            Sync
          </button>
        </React.Fragment> 
        :
        <React.Fragment>

          <ul>
            {points.map((point) => (
              <li key={point.value._id}>
                <span className={point.value.isCompleted ? 'completed' : ''}>
                  {point.value.title}
                  {point.value.description}
                  {point.value.point} <code>(ID: {point.value._id})</code>
                </span>
              </li>
            ))}
          </ul>

          <button type="button" onClick={switchScreen}>
            Close Syncing
          </button>
        </React.Fragment>
      }
    </div>
  )
}

export default App
