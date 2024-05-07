import React, { useCallback, useMemo, useState } from 'react';
import NodeCard from '../render/NodeCard';
import { useTranslation } from 'next-i18next';
import { Box, Button, Flex } from '@chakra-ui/react';
import { NodeInputKeyEnum } from '@fastgpt/global/core/workflow/constants';
import { NodeProps, Position } from 'reactflow';
import { FlowNodeItemType } from '@fastgpt/global/core/workflow/type';
import { IfElseListItemType } from '@fastgpt/global/core/workflow/template/system/ifElse/type';
import { useContextSelector } from 'use-context-selector';
import { WorkflowContext } from '../../../context';
import Container from '../../components/Container';
import { DragDropContext, DragStart, Draggable, DropResult, Droppable } from 'react-beautiful-dnd';
import { SourceHandle } from '../render/Handle';
import { getHandleId } from '@fastgpt/global/core/workflow/utils';
import ListItem from './ListItem';

const NodeIfElse = ({ data, selected }: NodeProps<FlowNodeItemType>) => {
  const { t } = useTranslation();
  const { nodeId, inputs = [] } = data;
  const onChangeNode = useContextSelector(WorkflowContext, (v) => v.onChangeNode);

  const [draggingItemHeight, setDraggingItemHeight] = useState(0);

  const ifElseList = useMemo(
    () =>
      (inputs.find((input) => input.key === NodeInputKeyEnum.ifElseList)
        ?.value as IfElseListItemType[]) || [],
    [inputs]
  );

  const onUpdateIfElseList = useCallback(
    (value: IfElseListItemType[]) => {
      const ifElseListInput = inputs.find((input) => input.key === NodeInputKeyEnum.ifElseList);
      if (!ifElseListInput) return;

      onChangeNode({
        nodeId,
        type: 'updateInput',
        key: NodeInputKeyEnum.ifElseList,
        value: {
          ...ifElseListInput,
          value
        }
      });
    },
    [inputs, nodeId, onChangeNode]
  );

  const reorder = (list: IfElseListItemType[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  const onDragStart = (start: DragStart) => {
    const draggingNode = document.querySelector(`[data-rbd-draggable-id="${start.draggableId}"]`);
    setDraggingItemHeight(draggingNode?.getBoundingClientRect().height || 0);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    const newList = reorder(ifElseList, result.source.index, result.destination.index);

    onUpdateIfElseList(newList);
    setDraggingItemHeight(0);
  };

  return (
    <NodeCard selected={selected} maxW={'1000px'} {...data}>
      <Box px={4}>
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <Droppable
            droppableId="droppable"
            renderClone={(provided, snapshot, rubric) => (
              <ListItem
                provided={provided}
                snapshot={snapshot}
                conditionItem={ifElseList[rubric.source.index]}
                conditionIndex={rubric.source.index}
                ifElseList={ifElseList}
                onUpdateIfElseList={onUpdateIfElseList}
                nodeId={nodeId}
              />
            )}
          >
            {(provided, snapshot) => (
              <Box {...provided.droppableProps} ref={provided.innerRef}>
                {ifElseList.map((conditionItem, conditionIndex) => (
                  <Draggable
                    key={conditionIndex}
                    draggableId={conditionIndex.toString()}
                    index={conditionIndex}
                  >
                    {(provided, snapshot) => (
                      <ListItem
                        provided={provided}
                        snapshot={snapshot}
                        conditionItem={conditionItem}
                        conditionIndex={conditionIndex}
                        ifElseList={ifElseList}
                        onUpdateIfElseList={onUpdateIfElseList}
                        nodeId={nodeId}
                      />
                    )}
                  </Draggable>
                ))}
                <Box height={draggingItemHeight} />
              </Box>
            )}
          </Droppable>
        </DragDropContext>
        <Container position={'relative'}>
          <Flex alignItems={'center'}>
            <Box color={'black'} fontSize={'lg'} ml={2}>
              ELSE
            </Box>
            <SourceHandle
              nodeId={nodeId}
              handleId={getHandleId(nodeId, 'source', 'ELSE')}
              position={Position.Right}
              translate={[26, 0]}
            />
          </Flex>
        </Container>
      </Box>
      <Box py={3} px={6}>
        <Button
          variant={'whiteBase'}
          w={'full'}
          onClick={() => {
            const ifElseListInput = inputs.find(
              (input) => input.key === NodeInputKeyEnum.ifElseList
            );
            if (!ifElseListInput) return;

            onUpdateIfElseList([
              ...ifElseList,
              {
                condition: 'AND',
                list: [
                  {
                    variable: undefined,
                    condition: undefined,
                    value: undefined
                  }
                ]
              }
            ]);
          }}
        >
          {t('core.module.input.Add Branch')}
        </Button>
      </Box>
    </NodeCard>
  );
};
export default React.memo(NodeIfElse);