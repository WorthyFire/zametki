Vue.component('todo-item', {
    template: `
        <li>
            {{ title }}
            <button v-on:click="$emit('remove')">Удалить</button>
        </li>
    `,
    props: ['title']
});

Vue.component('columns', {
    template: `
        <div class="columns">
            <column title="Новые" :cards="newColumn" @add-card="addCard('newColumn', $event)" @remove-card="removeCard('newColumn', $event)" @save-local-storage="saveToLocalStorage" @move-card-to-in-progress="moveCardToInProgress" @move-card-to-completed="moveCardToCompleted"></column>
            <column title="В процессе" :cards="inProgressColumn" @remove-card="removeCard('inProgressColumn', $event)" @save-local-storage="saveToLocalStorage" @move-card-to-in-progress="moveCardToInProgress" @move-card-to-completed="moveCardToCompleted" @lock-first-column="lockFirstColumn"></column>
            <column title="Выполненные" :cards="completedColumn" @remove-card="removeCard('completedColumn', $event)" @save-local-storage="saveToLocalStorage"></column>
        </div>
    `,
    data() {
        return {
            newColumn: [],
            inProgressColumn: [],
            completedColumn: [],
            maxCards: {
                newColumn: 3,
                inProgressColumn: 5,
                completedColumn: Infinity
            },
            isFirstColumnLocked: false
        }
    },
    created() {
        this.loadFromLocalStorage();
    },
    methods: {
        addCard(column, customTitle) {
            const totalCards = this.newColumn.length + this.inProgressColumn.length + this.completedColumn.length;
            if (totalCards >= this.maxCards.newColumn + this.maxCards.inProgressColumn + this.maxCards.completedColumn) {
                alert(`Достигнуто максимальное количество карточек во всех столбцах.`);
                return;
            }
            if (this[column].length >= this.maxCards[column]) {
                alert(`Достигнуто максимальное количество карточек в столбце "${this.getColumnTitle(column)}".`);
                return;
            }
            if (column !== 'newColumn') {
                alert(`Можно добавлять заметки только в столбец "Новые".`);
                return;
            }
            const newCard = {
                title: customTitle || 'Новая заметка',
                items: [
                    { text: '', completed: false, editing: true },
                    { text: '', completed: false, editing: true },
                    { text: '', completed: false, editing: true }
                ],
                status: 'Новые'
            };
            this[column].push(newCard);
            this.saveToLocalStorage();
        },
        removeCard(column, cardIndex) {
            this[column].splice(cardIndex, 1);
            this.saveToLocalStorage();
        },
        saveToLocalStorage() {
            localStorage.setItem('todo-columns', JSON.stringify({
                newColumn: this.newColumn,
                inProgressColumn: this.inProgressColumn,
                completedColumn: this.completedColumn
            }));
        },
        loadFromLocalStorage() {
            const data = JSON.parse(localStorage.getItem('todo-columns'));
            if (data) {
                this.newColumn = data.newColumn || [];
                this.inProgressColumn = data.inProgressColumn || [];
                this.completedColumn = data.completedColumn || [];
                // Установка состояния чекбоксов
                this.newColumn.forEach(card => card.items.forEach(item => item.completed = !!item.completed));
                this.inProgressColumn.forEach(card => card.items.forEach(item => item.completed = !!item.completed));
                this.completedColumn.forEach(card => card.items.forEach(item => item.completed = !!item.completed));
            }
        },
        getColumnTitle(column) {
            switch (column) {
                case 'newColumn':
                    return 'Новые';
                case 'inProgressColumn':
                    return 'В процессе';
                case 'completedColumn':
                    return 'Выполненные';
                default:
                    return '';
            }
        },
        moveCardToInProgress(card) {
            const index = this.newColumn.indexOf(card);
            if (index !== -1) {
                if (this.inProgressColumn.length >= this.maxCards.inProgressColumn) {
                    alert('Столбец "В процессе" уже содержит максимальное количество карточек.');
                    return;
                }

                this.newColumn.splice(index, 1);
                this.inProgressColumn.push(card);
                this.saveToLocalStorage();

                // Проверяем количество карточек в столбце "В процессе" и блокируем первый столбец, если необходимо
                if (this.inProgressColumn.length >= this.maxCards.inProgressColumn) {
                    this.lockFirstColumn();
                }
            }
        },
        moveCardToCompleted(card) {
            const index = this.inProgressColumn.indexOf(card);
            if (index !== -1) {
                this.inProgressColumn.splice(index, 1);
                this.completedColumn.push(card);
                this.saveToLocalStorage();
            }
        },
        lockFirstColumn() {
            this.isFirstColumnLocked = true;
        }
    }
});

Vue.component('column', {
    props: ['title', 'cards'],
    template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <card v-for="(card, index) in cards" :key="index" :card="card" @remove-card="removeCard(index)" @save-local-storage="saveToLocalStorage" @move-card-to-in-progress="moveCardToInProgress" @move-card-to-completed="moveCardToCompleted"></card>
            <button v-if="title === 'Новые'" @click="addCardWithCustomTitle">Добавить заметку</button>
        </div>
    `,
    methods: {
        removeCard(cardIndex) {
            this.$emit('remove-card', cardIndex);
        },
        addCardWithCustomTitle() {
            const customTitle = prompt('Введите заголовок для новой заметки:');
            if (customTitle) {
                this.$emit('add-card', customTitle);
            }
        },
        saveToLocalStorage() {
            this.$emit('save-local-storage');
        },
        moveCardToInProgress(card) {
            this.$emit('move-card-to-in-progress', card);
        },
        moveCardToCompleted(card) {
            this.$emit('move-card-to-completed', card);
        }
    }
});

Vue.component('card', {
    props: ['card', 'isFirstColumnLocked'],
    template: `
        <div class="card">
            <h3>{{ card.title }}</h3>
            <ul>
                <li v-for="(item, index) in card.items" :key="index">
                    <input type="text" v-model="item.text" :disabled="!item.editing || card.status === 'Выполненные' || (card.status === 'В процессе' && isFirstColumnLocked)">
                    <input type="checkbox" v-model="item.completed" @change="saveToLocalStorage" :disabled="card.status === 'Выполненные' || isFirstColumnLocked">
                    <button @click="saveItem(index)" v-if="item.editing && card.status !== 'Выполненные' && !isFirstColumnLocked">Сохранить</button>
                    <button @click="editItem(index)" v-else-if="!item.editing && card.status !== 'Выполненные' && !isFirstColumnLocked">Редактировать</button>
                    <button @click="removeItem(index)" v-if="card.items.length > 3 && !isFirstColumnLocked && card.status !== 'Выполненные'">Удалить</button>
                </li>
                <li v-if="card.items.length < 5 && card.status !== 'Выполненные' && !isFirstColumnLocked">
                    <button @click="addItem">Добавить пункт</button>
                </li>
            </ul>
            <button v-if="card.status !== 'Выполненные' && !isFirstColumnLocked" @click="removeCard">Удалить заметку</button>
            <p v-if="card.status === 'Выполненные'">Дата завершения: {{ card.completionDate }}</p>
        </div>
    `,
    methods: {
        addItem() {
            if (this.card.items.length < 5 && this.card.items.length >= 3 && !this.isFirstColumnLocked) {
                this.card.items.push({ text: '', completed: false, editing: true });
                this.saveToLocalStorage();
            } else {
                alert('Достигнуто максимальное количество пунктов или первый столбец заблокирован.');
            }
        },
        removeItem(index) {
            if (this.card.items.length > 3 && !this.isFirstColumnLocked && this.card.status !== 'Выполненные') {
                this.card.items.splice(index, 1);
                this.saveToLocalStorage();
            }
        },
        removeCard() {
            if (!this.isFirstColumnLocked && this.card.status !== 'Выполненные') {
                this.$emit('remove-card');
            } else {
                alert('Нельзя удалять карточки в столбце "Выполненные" или если первый столбец заблокирован.');
            }
        },
        saveItem(index) {
            if (this.card.status !== 'Выполненные' && !this.isFirstColumnLocked) {
                this.card.items[index].editing = false;
                this.saveToLocalStorage();
            }
        },
        editItem(index) {
            if (this.card.status !== 'Выполненные' && !this.isFirstColumnLocked) {
                this.card.items[index].editing = true;
            }
        },
        saveToLocalStorage() {
            this.checkCardStatus();
            this.$emit('save-local-storage');
        },
        checkCardStatus() {
            const completedItems = this.card.items.filter(item => item.completed).length;
            const totalItems = this.card.items.length;
            const completionPercentage = (completedItems / totalItems) * 100;

            if (completionPercentage >= 100) {
                this.card.status = 'Выполненные';
                this.card.completionDate = new Date().toLocaleString();
                this.$emit('move-card-to-completed', this.card);
            } else if (completionPercentage > 50 && this.card.status === 'Новые' && this.isFirstColumnLocked) {
                this.$emit('lock-first-column');
            } else if (completionPercentage > 50 && this.card.status === 'Новые') {
                this.$emit('move-card-to-in-progress', this.card);
            } else if (completionPercentage === 100 && this.card.status === 'В процессе') {
                // В этом блоке не нужно ничего делать, так как карточка уже находится в столбце "В процессе"
            } else {
                this.card.status = 'Новые';
            }
        }
    }
});

new Vue({
    el: '#app',
    data() {
        return {
            newColumn: [],
            inProgressColumn: [],
            completedColumn: [],
            isFirstColumnLocked: false
        }
    },
    created() {
        this.loadFromLocalStorage();
    },
    methods: {
        removeCard(column, cardIndex) {
            this[column].splice(cardIndex, 1);
            this.saveToLocalStorage();
        },
        saveToLocalStorage() {
            localStorage.setItem('todo-columns', JSON.stringify({
                newColumn: this.newColumn,
                inProgressColumn: this.inProgressColumn,
                completedColumn: this.completedColumn
            }));
        },
        loadFromLocalStorage() {
            const data = JSON.parse(localStorage.getItem('todo-columns'));
            if (data) {
                this.newColumn = data.newColumn || [];
                this.inProgressColumn = data.inProgressColumn || [];
                this.completedColumn = data.completedColumn || [];
                this.newColumn.forEach(card => card.items.forEach(item => item.completed = !!item.completed));
                this.inProgressColumn.forEach(card => card.items.forEach(item => item.completed = !!item.completed));
                this.completedColumn.forEach(card => card.items.forEach(item => item.completed = !!item.completed));
            }
        },
    }
});
