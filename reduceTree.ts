

// {
//     id: "1",
//     children: [
//         { id: "2" },
//         { id: "3" }
//     ]
// }


type TreeItem<T> = T & {
    children: TreeItem<T>[],
}

let tree: TreeItem<{ id: number }> = {id: 1, children: [{
    id: 2, children: []
}]}

/**
 * Функция работает аналогично `Array.prototype.reduce`, только
 * для элементов дерева. Поддерживает пред- и пост-порядок прохода.
 */
function reduceTree<T, S>(
    root: TreeItem<T>,
    reducer: (state: S, item: T) => S,
    initialState: S,
    traversal: 'pre-order' | 'post-order',
): S {
    let newState: S = initialState;

    let processItem = (nextItem: TreeItem<T>) => {
        if (traversal === 'pre-order') {
            newState = reducer(newState, nextItem);
        }

        if (nextItem.children.length) {
            nextItem.children.forEach((el) => processItem(el))
        }

        if (traversal === 'post-order') {
            newState = reducer(newState, nextItem);
        }
    }

    if (!root) {
        return initialState
    }

    processItem(root)

    return newState
}

let aaa = reduceTree<{ id: string }, {sum: string}>({
    id: "1",
    children: [
        { id: "2", children:[] },
        { id: "3", children:[] }
    ]
}, (a,b) => { return {"sum":  a["sum"] + b.id} }, {sum: "0"}, "post-order")


console.log(aaa)
