from typing import List
from bisect import bisect_left
from .schemas import LabelOp, Label
from sqlalchemy.orm import Session
from .models import *

def op_add(entities : List[dict], text : str, op : LabelOp) -> bool:
    if op.start_pos >= op.end_pos:
        return False
    if text[op.start_pos : op.end_pos] != op.word:
        return False
    if op.score > 1 or op.score < 0:
        return False
    label = Label(entity_group=op.entity_group, score=op.score, word=op.word, start=op.start_pos, end=op.end_pos, dirty=op.dirty)
    label_dict = label.model_dump()
    idx = bisect_left(entities, op.start_pos, key=(lambda x : x['start']))
    if idx > 0 and entities[idx - 1]['end'] > label_dict['start']:
        return False
    if idx < len(entities) and entities[idx]['start'] < label_dict['end']:
        return False
    entities.insert(idx, label_dict) # change to more efficient data structure
    return True

def op_delete(entities : List[dict], text : str, op : LabelOp) -> bool:
    if text[op.start_pos : op.end_pos] != op.word:
        return False
    idx = bisect_left(entities, op.start_pos, key=(lambda x : x['start']))
    if idx > len(entities):
        return False
    if entities[idx]['start'] != op.start_pos or entities[idx]['end'] != op.end_pos:
        return False
    del entities[idx]
    return True

def op_update(entities : List[dict], text : str, op : LabelOp) -> bool:
    if text[op.start_pos : op.end_pos] != op.word:
        return False
    if text[op.new_start_pos : op.new_end_pos] != op.new_word:
        return False
    idx = bisect_left(entities, op.start_pos, key=(lambda x : x['start']))
    if idx > len(entities):
        return False
    if entities[idx]['start'] != op.start_pos or entities[idx]['end'] != op.end_pos:
        return False
    
    idx_new = bisect_left(entities, op.new_start_pos, key=(lambda x : x['start']))

    cur_ent = entities.pop(idx)
    if idx_new > idx:
        idx_new = idx_new - 1

    if idx_new > 0 and entities[idx_new - 1]['end'] > op.new_start_pos:
        return False
    if idx_new < len(entities) and entities[idx_new]['start'] < op.new_end_pos:
        return False
    # validation complete
    cur_ent['start'] = op.new_start_pos
    cur_ent['end'] = op.new_end_pos
    cur_ent['word'] = op.new_word
    if op.dirty is not None:
        cur_ent['dirty'] = op.dirty
    if op.score is not None:
        cur_ent['score'] = op.score
    if op.entity_group is not None:
        cur_ent['entity_group'] = op.entity_group
    entities.insert(idx_new, cur_ent)
    return True

def process_op(entities : List[dict], text : str, op : LabelOp) -> bool:
    if op.label_op == "add":
        return op_add(entities, text, op)
    if op.label_op == "delete":
        return op_delete(entities, text, op)
    if op.label_op == "update":
        return op_update(entities, text, op)
    return False